# 1. 機能要件 / 非機能要件
- 機能要件:
  - タスクテーブルに progress（進捗）入力列を追加し、既存の `Task.progress` を表示・編集できるようにする。
  - progress のデータ概念は既存の `Task.progress`（0〜100 の割合）をそのまま利用し、新しいドメイン概念は追加しない。
  - progress 列は `visibleFields` / `columnsState` に統合され、表示・非表示・順序・幅の制御が既存の列と同様に行える。
  - 進捗の編集は既存の TaskList セル編集 UI（選択 → Enter / ダブルクリック → Overlay 編集 → commit）に統合する。
  - 編集コミット時は `onCellCommit` を利用し、ホスト側が更新後の `tasks` を渡すことでガント表示と整合を保つ。
- 非機能要件:
  - 既存 UI のレイアウトや列サイズ計算を崩さず、既存の列操作（ドラッグ/リサイズ/選択/編集）と整合する。
  - 既存の public API / props / callback / イベントとの互換性を維持し、破壊的変更を行わない。
  - UI はアクセシビリティ（キーボード操作、スクリーンリーダー用のラベル）に配慮し、既存のセル編集仕様と同等の操作性を保つ。

# 2. スコープと変更対象
- 変更ファイル（設計成果物）: `.github/copilot/plans/133-task-table-progress-column-design.md`（新規、設計のみ）。実装時の想定変更対象は次項に列挙する。
- 実装時に想定される変更対象（確認済みの既存ファイルのみ列挙）:
  - `src/types/public-types.ts`（`VisibleField` に `progress` を追加、`Task.progress` 既存概念を利用）
  - `src/helpers/task-helper.ts`（`DEFAULT_VISIBLE_FIELDS` に progress を追加、表示用の正規化 helper 追加）
  - `src/components/task-list/task-list-header.tsx`（列ラベルに progress を追加）
  - `src/components/task-list/task-list-table.tsx`（progress 列の表示・編集許可・セルレンダリングの追加）
  - `src/components/task-list/overlay-editor.tsx`（progress 編集時の input 種別・入力属性の調整）
  - `src/test/task-list-table-editing.test.tsx` / `src/test/task-list-commit.test.tsx`（progress 列の表示・編集・commit 回帰テスト追加）
  - `README.md`（visibleFields と progress 編集の記述追記）
  - `example/` 配下（サンプルで progress 列を表示・編集する場合の更新）
- 影響範囲・互換性リスク:
  - `visibleFields` 未指定時のデフォルト列に progress が追加されるため、既存利用者のテーブル幅が増える。
  - 互換性を維持するため、progress 列は `visibleFields` で除外可能とし、既存 UI を保持したい場合の設定方法を README に明記する。
- 外部依存・Secrets の扱い:
  - 外部依存の追加なし。Secrets/PII を扱わない。

# 3. 設計方針
- 責務分離 / データフロー（必要なら Mermaid 1 枚）:
  - ライブラリ側:
    - Task Table に progress 列を追加し、表示・選択・編集・commit UI を提供する。
    - `onCellCommit` を通じて progress 更新イベントを通知する。
    - 進捗値の表示/入力の正規化（0〜100 に丸め・クランプ）を UI 表示の範囲で行う。
  - 利用側アプリ:
    - `onCellCommit` で progress 更新を受け取り、必要に応じて検証/永続化を行う。
    - 更新後の `tasks` を再投入し、ガント側表示と整合を取る。
    - `visibleFields` / `columnsState` で progress 列の表示/非表示を制御する。
  - データフロー:
    ```mermaid
    flowchart LR
      TaskListTable -->|select/edit| OverlayEditor
      OverlayEditor -->|onCellCommit(columnId=progress)| HostApp
      HostApp -->|update tasks.progress| Gantt
      HostApp -->|tasks prop| TaskListTable
    ```
- UI 要件（progress 列の表示内容と編集時の基本挙動）:
  - 列ラベルは「進捗(%)」とし、セル表示は `Task.progress` の数値（%記号なし）を表示する。
  - 編集時は `type="number"` 入力を使用し、`min=0`, `max=100` を指定する（OverlayEditor の columnId 判定で付与）。step の粒度は Undetermined とする。
  - 表示値は 0〜100 の範囲にクランプし、丸め/小数表記の方針は Undetermined とする。`Task.progress` が `NaN` や `null` 等の場合は空表示にする。
  - 編集確定時は入力値を `Number` 変換し、0〜100 にクランプした値を `onCellCommit` に渡す。丸め方針は Undetermined とし、決定後に step に合わせた丸めを適用する。変換不能の場合は commit を実行せず、編集 UI に `0〜100 の数値を入力してください` を表示して入力を促す（既存の OverlayEditor の error 表示領域を使用）。
  - 編集可能条件は既存の `isCellEditable` と同一（`onCellCommit` があること、`task.isDisabled !== true`）を基本とする。
- 既存 API / props / callback / イベントとの整合方針:
  - `VisibleField` に `progress` を追加し、`visibleFields` に progress を指定可能にする。
  - progress 更新の通知は `onCellCommit` を第一候補とし、`onProgressChange` 併用の可否は Undetermined とする。ガント側更新はホストが `tasks` を更新して反映する前提とする。
  - `onTaskUpdate` は既存の実績正規化用途を維持し、progress 更新では使用しない（ホスト側が `tasks` を更新して再描画）。
- エッジケース / 例外系 / リトライ方針:
  - 空文字や数値変換不能な値は commit を実行せず、編集 UI に「0〜100 の数値を入力してください」などのエラーメッセージを表示する。
  - 0 未満 / 100 超の入力はクランプし、commit 値を 0〜100 に収める。
  - `task.isDisabled === true` の行は progress も編集不可とする（既存ルール維持）。
- ログと観測性（漏洩防止を含む）:
  - 追加ログは不要（既存の編集ログのみ）。

# 4. テスト戦略
この章では、将来の IMPLEMENT／テスト工程で“何をもって完了とするか”を設計として明示する。(この1行は変更せずにそのまま出力する)
DESIGN フェーズではテストを実施しない。(この1行は変更せずにそのまま出力する)
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常系: progress 列がタスクテーブルに表示され、`Task.progress` の値が表示される。
  - 正常系: progress セルを選択し Enter/ダブルクリックで Overlay 編集が起動する。
  - 正常系: 0〜100 の入力で `onCellCommit` が呼ばれ、値が 0〜100 の範囲に収まって渡される（丸め方針は決定後に追加する）。
  - 例外系: 空文字 / `NaN` 入力時に commit が行われず、エラーメッセージが表示される。
  - 境界: 0 と 100 を入力した際に clamp されずそのまま確定する。
  - 回帰: `onCellCommit` 未指定時は progress も編集不可である。
  - 回帰: ガント側の `onProgressChange` とは独立して動作し、ホストが `tasks` 更新を行うとガント表示が同期する。
- 受入条件（IMPLEMENT で確認する粒度）:
  - Given タスクテーブルに progress 列が存在しない現状
    When 本設計に基づいて実装を行う
    Then タスクテーブル上に progress を入力できる列が追加される設計になっている
  - Given 既に progress というデータ概念が存在している
    When タスクテーブルから progress を更新する
    Then 新しい進捗概念を追加せず、既存 progress を利用する設計になっている
  - Given タスクテーブルとガント表示の両方が存在する
    When タスクテーブル側で進捗を変更する
    Then ガント側表示との整合が保たれる設計になっている
  - Given 既存利用者がこのライブラリを利用している
    When progress 列追加の設計を適用する
    Then 互換性影響と必要な変更点が plan に明記されている
  - Given 未確定の UI 仕様や対象範囲が存在する
    When DESIGN plan をレビューする
    Then Undetermined と確認方法が明示され、IMPLEMENT で迷わない状態になっている
- モック / フィクスチャ方針:
  - `TaskListTableDefault` の既存フィクスチャに progress を追加して表示・選択を検証する。
  - `TaskList` の commit テストで progress columnId を用いた commit 事例を追加する。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm run test:unit`（ユニット/回帰テスト）
  - `npm test`（lint/build/unit を包含）

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - lint/build/test: `npm test`（`test:unit` + `test:lint` + `test:build`）
  - security: `npm audit`
- 通過基準と失敗時の対応:
  - すべてのテストが green であること。失敗時は progress 列の編集/表示/commit の実装を見直す。

# 6. ロールアウト・運用
- ロールバック方法:
  - progress 列の追加を含むコミットをリバートする。
- 監視・運用上の注意:
  - 既存利用者が progress 列追加により横幅が変わるため、README とリリースノートで opt-out 方法を明記する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - progress 入力 UI の具体形式（step 単位・小数許容・表示/commit の丸め方針）
    - 状態: Undetermined
    - 影響: 入力可能な値の粒度、既存データとの互換性に影響する。
    - 決定方法: 既存の progress 更新（ガント操作）が整数丸めであることは確認済みだが、タスクテーブル入力でも同一粒度に統一するかは未合意のため、既存利用例とプロダクト方針を確認して決定する。
  - どの task 種別を progress 編集対象にするか
    - 状態: Undetermined
    - 影響: milestone/project などの編集期待値に影響する。
    - 決定方法: 既存の bar 操作で progress を更新可能な task 種別を確認し、同じ制限に合わせる。
  - progress 更新時に `onProgressChange` も呼び出すか
    - 状態: Undetermined
    - 影響: ホスト側のイベント処理の重複や互換性に影響する。
    - 決定方法: 既存の公開 API 利用例を確認し、二重通知を避ける方針を決定する。
  - 既存レイアウトへの影響（列順序/幅）
    - 状態: Undetermined
    - 影響: テーブル幅や既存ユーザーの表示崩れに影響する。
    - 決定方法: 既存の `DEFAULT_VISIBLE_FIELDS` と UI モックを確認し、最小のレイアウト変更となる列順を確定する。
  - 実際の変更対象ファイル
    - 状態: Undetermined
    - 影響: IMPLEMENT Issue の粒度に影響する（上記は想定リストであり、追加/除外があり得る）。
    - 決定方法: IMPLEMENT で再度 `src/components/task-list/` と README/example を中心に調査し、最小差分の変更対象を確定する。
- ADR に残すべき判断:
  - なし（既存 progress 概念の UI 追加に留まるため）。
