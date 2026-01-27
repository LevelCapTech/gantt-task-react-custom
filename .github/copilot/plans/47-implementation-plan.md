# 1. 機能要件 / 非機能要件
- 機能要件:
  - 下段スクロールバー行を「左: Task Table / 中: 分割バー / 右: Gantt 本体」の3カラム構造に変更する。
  - 左スクロールは Task Table（ヘッダ＋ボディ）へ反映し、右側へ影響させない。
  - 右スクロールは Gantt 本体（グリッド・バー・カレンダー）へ反映し、左側へ影響させない。
  - 下段の分割バーは上段と同一のドラッグ操作で Task/Gantt の幅を変更できる。
  - 既存のホイール/キー操作は右側（Gantt 本体）の水平スクロールと縦スクロールにのみ作用し、左側には影響しない（Shift+Wheel/横ホイールも右側のみ）。
- 非機能要件:
  - 既存 API と互換性を保ち、既存の挙動や props を変更しない。
  - 追加の外部依存や Secrets を導入しない。
  - スクロールイベントの干渉を防ぐため、左右のループ防止フラグを独立させる。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 修正: `src/components/gantt/gantt.tsx`（左右スクロール state/イベント分離、下段レイアウト3カラム化）
  - 修正: `src/components/other/horizontal-scroll.tsx`（左右専用化に伴う API/スタイル調整）
  - 修正: `src/components/gantt/gantt.module.css`（下段スクロールバー行の3カラム配置）
  - テスト: `src/test/*` 既存テストの追加/更新（左右独立スクロールと分割バーの回帰）
- 影響範囲・互換性リスク:
  - 下段スクロールバー行の DOM 構造変更による CSS 上書き影響。
  - スクロール state の増設に伴う同期ズレ・イベントループのリスク。
- 外部依存・Secrets の扱い:
  - 新規依存なし。Secrets/PII は扱わない。

# 3. 設計方針
- 責務分離 / データフロー:
  - スクロール SSOT:
    - `Gantt` が `scrollXLeft` / `scrollXRight` を保持し、DOM の `scrollLeft` は state の派生値とする。
    - `HorizontalScroll` と Task/Gantt のスクロール可能コンテナは state を受け取り、`useEffect` で `scrollLeft` を反映する。
  - 更新権限 / 入力優先順位:
    - 左: 下段左スクロールバーの `onScroll` のみが `scrollXLeft` を更新する。
    - 右: 下段右スクロールバーの `onScroll`、ホイール（Shift+Wheel/横ホイール含む）、キー入力が `scrollXRight` を更新する。
    - 同時入力はイベント到達順で上書きし、特別な優先順位は設けない（最新入力が正）。
    - ホイール/キー入力は上段の Gantt wrapper で従来通り捕捉し、フォーカスやマウス位置依存の新仕様は導入しない。
  - 上下段レイアウト同期:
    - 上段/下段は別 DOM とし、`taskListWidth` と `SPLIT_HANDLE_WIDTH` を `Gantt` state の SSOT として共有する。
    - 両段とも `gridTemplateColumns: ${taskListWidth}px ${SPLIT_HANDLE_WIDTH}px 1fr` を適用し、上下段の分割位置を一致させる。
    - 下段の分割バーも上段と同一のドラッグハンドラを用い、幅変更は `taskListWidth` state に集約する。
  - ループ防止フラグの状態遷移:
    - 左右それぞれ `ignoreScrollLeftRef` / `ignoreScrollRightRef`（`useRef<boolean>`）を持つ。
    - ユーザー入力（下段スクロールバーの `onScroll`）時:
      1) ignore が `false` の場合のみ state 更新 → ignore を `true` に設定。
      2) `useEffect` による programmatic scroll 発火後、`onScroll` で ignore を `false` に戻す。
    - programmatic 入力（ホイール/キー）時:
      1) state 更新前に ignore を `true` に設定。
      2) DOM 更新に伴う `onScroll` で ignore を `false` に戻す。
- エッジケース / 例外系 / リトライ方針:
  - `listCellWidth` 未設定時は Task Table を非表示とし、下段左スクロールも非表示にする。
  - コンテナ幅が最小幅を下回る場合は既存の clamp 処理を維持して破綻を防ぐ。
  - `ignore` フラグの誤設定による無限ループを避けるため、更新は最新値のみ反映する。
- ログと観測性（漏洩防止を含む）:
  - 新規ログは追加せず、機微情報は出力しない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 左スクロール操作が Task Table のみを動かすことの確認:
    - 観測対象: `taskListRef.current`（Task Table のスクロールコンテナ）と `TaskListHeader`/`TaskListTable` の横スクロール要素。
    - 判定: 左スクロール後に Task 側の `scrollLeft` が更新され、Gantt 側の `scrollLeft` は不変。
  - 右スクロール操作が Gantt 本体のみを動かし、Calendar が追従することの確認:
    - 観測対象: `verticalGanttContainerRef`（Gantt 本体コンテナ）と Calendar の横スクロール要素。
    - 判定: 右スクロール後に Gantt 側 `scrollLeft` が更新され、Task 側は不変。
  - 左右スクロールを交互に操作しても同期しないことの回帰確認:
    - 観測対象: 左右の下段スクロールバー、Task/Gantt 各コンテナの `scrollLeft`。
    - 判定: 交互操作後に `scrollLeft` が独立して保持される。
  - ループ防止の回帰:
    - 観測対象: `onScroll` ハンドラの呼び出し回数、`ignore` の戻り。
    - 判定: programmatic 更新と user scroll を区別し、`onScroll` が二重に state 更新しない。
  - 下段分割バー操作で上下段の分割位置が一致することの確認:
    - 観測対象: 上段/下段コンテナの `gridTemplateColumns` と `taskListWidth`。
    - 判定: ドラッグ後に両段の列幅が一致する。
- モック / フィクスチャ方針:
  - React Testing Library の scroll/keyboard/wheel イベントを用い、対象 DOM の `scrollLeft` を検証する。
  - テストで確実に観測できるよう、下段スクロールバー/スクロール対象には `data-testid` を付与して判定を明確化する。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm run test:unit`

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm run test:lint`
  - `npm run test:unit`
  - `npm run test:build`
- 通過基準と失敗時の対応:
  - すべてのコマンドが成功すること。失敗時は変更範囲内で修正し再実行する。

# 6. ロールアウト・運用
- ロールバック方法:
  - 下段スクロールバー行を従来の1本構成に戻し、左右スクロール state を削除する。
- 監視・運用上の注意:
  - DOM/CSS 変更により利用側のカスタム CSS に影響がないか確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - 分割バー幅は既存定数（splitterWidth）と一致させる。
- ADR に残すべき判断:
  - ADR なし。理由: 変更は内部レイアウト/入力経路の整理で、公開 API・データモデル・永続化仕様に影響せず、可逆であるため。
  - ただし将来、左右同期や永続化など API 追加を伴う場合は ADR を追加する。
