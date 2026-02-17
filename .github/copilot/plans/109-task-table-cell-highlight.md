# 1. 機能要件 / 非機能要件
- 機能要件:
  - Task Table のセル `hover` 時に背景色 + 枠線のハイライトを表示する。
  - セルクリックで選択されたセルを「濃い」背景色 + 枠線でハイライトする。
  - 選択セルと同一行の他セルを「淡い」背景色でハイライトする。
  - 優先順位は SelectedCell > HoveredCell > SelectedRow とし、同時成立時に視認性が損なわれない。
  - 既存の選択/編集の挙動（選択保持・解除条件）は変更しない。
- 非機能要件:
  - outline などレイアウトがずれない描画方式を優先する。
  - 既存の DOM 構造/仮想化を変更せず、最小限の class 付与で完結させる。
  - 既存のセル内クリック可能要素の挙動を阻害しない。

# 2. スコープと変更対象
- 変更ファイル（設計成果物）: `.github/copilot/plans/109-task-table-cell-highlight.md`（新規、設計のみ）。実装時の想定変更対象は次項に列挙する。
- 実装時に想定される変更対象:
  - `src/components/task-list/task-list-table.tsx`（選択行/選択セルの class 付与）
  - `src/components/task-list/task-list-table.module.css`（hover/selected/row ハイライトのスタイル追加）
  - `src/test/task-list-table-highlight.test.tsx`（`task-list-table-editing.test.tsx` と同じハイフン区切り命名で、選択・行ハイライト専用の回帰テストを新規追加）
- 影響範囲・互換性リスク:
  - Task Table の表示スタイルのみ。選択・編集のロジックは変更しない。
  - 既存の zebra 行背景（even 行）と競合するため、選択行の背景が上書きされるように CSS 優先度を調整する。
- 外部依存・Secrets の扱い: 追加なし（CSS/JS のみ、Secrets 不要）。

# 3. 設計方針
- 責務分離 / データフロー:
  - `TaskListEditingStateContext.editingState` を SSOT として選択セル/行を算出する。
  - `TaskListTableDefault` が `editingState` から `isSelectedCell` と `isSelectedRow` を算出し、CSS Modules の class を付与する。
  - hover は React state を追加せず、CSS の `:hover` で表現する。
  - データフロー:
    ```mermaid
    flowchart LR
      EditingState -->|rowId/columnId| TaskListTableDefault
      TaskListTableDefault -->|className| taskListTableModule[task-list-table.module.css]
      taskListTableModule -->|背景/枠線| TaskListTableDOM[TaskListTable DOM]
    ```
- UI スタイル設計（優先度の担保）:
  - CSS Modules の命名は既存の `taskListCell` / `taskListTableRow` に揃え、`taskListCellSelected` / `taskListTableRowSelected` の形式で統一する。
  - `taskListCellSelected`: SelectedCell 用の濃色背景 + outline。`outline-offset: -2px` を基本とし、Chrome/Firefox で 125% 以上のズーム時に枠線が隣接セルへはみ出す、または 1px 以上ずれる場合はいずれかの条件で `box-shadow: inset 0 0 0 2px` へ切り替える（100%/125%/150% で確認）。
  - `taskListCell` の `:hover`: 背景 + outline を付与し、`taskListCellSelected` より弱い色を使用する。
  - `taskListRowSelected`: row 要素（`<div className={styles.taskListTableRow}>`）に `taskListTableRowSelected` を追加し、`.taskListTableRow.taskListTableRowSelected` を定義する（既存の `.taskListTableRow:nth-of-type(even)` を上書きできる specificity を確保）。
  - 優先順位の具体化（例）:
    - hover は `.taskListCell:not(.taskListCellSelected):hover` で定義し、SelectedCell を明示的に除外する。
    - SelectedCell は `.taskListCellSelected` で最優先の背景/outline を定義する。
  - カラーは既存 UI との調和を保つ中立色/淡いブルー系で決定し、可読性を確保する（詳細は「未確定事項」で決定）。
- エッジケース / 例外系 / リトライ方針:
  - `editingState.mode === "viewing"` の場合は選択行/セルを付与しない。
  - `editingState.rowId` / `columnId` が `tasks` / `columns` に存在しない場合はハイライトしない。
  - `editingState.mode === "editing"` の場合も選択セルは保持し、編集中のセルが引き続きハイライトされる。
  - `outline-offset` の描画差異が出る場合は `box-shadow` へ切り替え、主要ブラウザで表示確認する。
- ログと観測性（漏洩防止を含む）:
  - 追加ログは不要（UI 表現のみ）。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常系: セルクリックで選択セルに `taskListCellSelected` が付く。
  - 正常系: 選択行の他セルに `taskListRowSelected` 由来の背景が適用される。
  - 正常系: `hover` 時に `taskListCell` が hover スタイルになる（SelectedCell が優先）。
  - 回帰: SelectedCell > HoveredCell > SelectedRow の優先順位が維持される（選択セル上の hover でも SelectedCell が維持される）。
  - 回帰: 既存の選択/編集挙動（Enter/ダブルクリック）のテストが通る。
- モック / フィクスチャ方針:
  - `TaskListTableDefault` の既存テストフィクスチャを再利用し、`data-row-id` / `data-column-id` を使って対象セルを取得する。
  - `src/test/task-list-table-highlight.test.tsx` を新設し、ハイライト専用のテストを集約する。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm run test:unit`（対象テストのみ）
  - `npm test`（lint/build/unit を包含）

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - lint: `npm run test:lint`
  - typecheck/build: `npm run test:build`
  - test: `npm run test:unit`
  - 一括: `npm test`
  - security: `npm audit`（既存の標準コマンド。CI に組み込まれている場合はそちらに準拠）
- 通過基準と失敗時の対応:
  - すべて成功すること。失敗時はハイライト用 class 付与と CSS 優先度を見直す。

# 6. ロールアウト・運用
- ロールバック方法: UI 変更のみのため、該当 CSS/class 追加を元に戻す。
- 監視・運用上の注意: 画面上の視認性確認のみ（性能劣化が無いかの簡易確認）。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - SelectedCell / HoveredCell / SelectedRow の具体的な色（既存テーマに合わせて決定）。
  - 外側クリック時に選択解除されるかどうかの現行挙動（現状維持であることを確認）。
- ADR に残すべき判断:
  - なし（局所的な UI 表現のため ADR 不要）。
