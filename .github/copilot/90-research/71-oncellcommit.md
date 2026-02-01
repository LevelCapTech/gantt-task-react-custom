# 71-oncellcommit: onCellCommit 調査

本ドキュメントは [RESEARCH] Issue における調査結果をまとめたものです。仕様の入口は [00-index.md](../00-index.md) を参照してください。

## 1. 機能要件 / 非機能要件
- 機能要件:
  - onCellCommit のフロー、TaskList/TaskListTable のデータソース、メモ化ポイント、編集状態遷移を整理する。
  - example App で onCellCommit が no-op であることを確認する。
- 非機能要件:
  - ドキュメント追加のみで既存コードの挙動は変更しない。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）: `.github/copilot/90-research/71-oncellcommit.md`（新規）
- 影響範囲・互換性リスク: なし（調査ドキュメントのみ）。
- 外部依存・Secrets の扱い: 追加なし。

## 3. 設計方針
- 責務分離 / データフロー:
  - Gantt → TaskList → OverlayEditor の onCellCommit 経路と編集状態の責務分離を整理する。
- エッジケース / 例外系 / リトライ方針:
  - onCellCommit 失敗時は編集状態を維持し、エラーメッセージ表示となる点を明記する（詳細は 8.5 参照）。
- ログと観測性（漏洩防止を含む）:
  - 既存ログ（console）を参照し、追加は行わない。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）: ドキュメントのみのため対象外。
- モック / フィクスチャ方針: 追加なし。
- テスト追加の実行コマンド（例: `python -m pytest`）: 実行なし。

## 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）: 変更なし。
- 通過基準と失敗時の対応: 既存ゲートは別途運用。

## 6. ロールアウト・運用
- ロールバック方法: ドキュメントのみのため不要。
- 監視・運用上の注意: なし。

## 7. オープンな課題 / ADR 要否
- 未確定事項: なし。
- ADR に残すべき判断: なし。

## 8. 調査結果

### 8.1 調査対象コミット
- `git rev-parse HEAD`: `8d77e8847b6e270a051868926cd5947f4313127b`

### 8.2 onCellCommit フロー
- 型定義:
  - `CellCommitPayload` は `rowId/columnId/value/trigger` を持つ（`src/types/public-types.ts:L18-L25`）。
  - `onCellCommit` は `Promise<void>` を返す（`src/types/public-types.ts:L121-L125`）。
- 伝搬経路:
  - `Gantt` で受けた `onCellCommit` を `TaskList` へ渡す（`src/components/gantt/gantt.tsx:L608-L631`）。
  - `TaskList` の `commitEditing` が `onCellCommit` を await し、成功時に編集状態を `viewing` に戻す（`src/components/task-list/task-list.tsx:L249-L315`）。
  - `OverlayEditor` から `onCommit` が呼ばれ、`trigger` は常に `enter` として渡される（`src/components/task-list/overlay-editor.tsx:L302-L311`）。
- 編集開始:
  - `TaskListTable` がセルのダブルクリック/Enter/キー入力で `startEditing` を呼び、編集状態を `editing` に遷移させる（`src/components/task-list/task-list-table.tsx:L334-L395`）。

### 8.3 TaskList / TaskListTable のデータソース
- `Gantt` は `tasks` を `barTasks` に変換して保持し、`TaskList` に `tasks: barTasks` を渡す（`src/components/gantt/gantt.tsx:L133-L160`, `L608-L631`）。
- `TaskListTable` は `tasks.map` で描画し、セル表示は `tasks` の値に依存する（`src/components/task-list/task-list-table.tsx:L241-L424`）。
- テーブル列は `columnsState` または `visibleFields` から構築される（`src/components/task-list/task-list-table.tsx:L47-L53`）。
- 編集許可は `onUpdateTask` と `onCellCommit` の両方がある場合のみ有効化される（`src/components/task-list/task-list-table.tsx:L53-L55`）。

### 8.4 メモ化 / 再計算の観察
- `TaskList` では初期列と表示列が `useMemo` で安定化される（`src/components/task-list/task-list.tsx:L141-L179`）。
- 編集コンテキスト値も `useMemo` で保持される（`src/components/task-list/task-list.tsx:L382-L389`）。
- `OverlayEditor` の入力タイプ・セレクト候補・ポータルルートが `useMemo` で計算される（`src/components/task-list/overlay-editor.tsx:L106-L125`）。
- 一方で `headerProps`/`tableProps`/`columnIds` などは毎レンダー生成されるため、負荷が高い場合は再レンダーによる性能影響の可能性がある（`src/components/task-list/task-list.tsx:L181-L206`, `src/components/task-list/task-list-table.tsx:L47-L74`）。

### 8.5 編集状態と UI 挙動
- 編集状態は `mode/rowId/columnId/trigger/pending/errorMessage` を保持し、`selectCell` と `startEditing` で遷移する（`src/components/task-list/task-list.tsx:L208-L348`）。
- `commitEditing` は pending を立てて `onCellCommit` を await し、成功時は view に戻し、失敗時はエラーメッセージを設定する（`src/components/task-list/task-list.tsx:L249-L313`）。
- `TaskListTable` は pending 中のセル選択を抑制し、`isDisabled` 行は編集不可にする（`src/components/task-list/task-list-table.tsx:L76-L82`, `L315-L326`）。
- `OverlayEditor` は pending 中に入力を固定し、値が変わらない場合は blur で編集キャンセル、エラー時はメッセージを表示する（`src/components/task-list/overlay-editor.tsx:L334-L355`, `L373-L431`）。

### 8.6 最小再現手順（example App）
- 前提: example では `onCellCommit={async () => {}}` が no-op で渡されている（`example/src/App.tsx:L193-L233`）。
- 手順:
  - `cd example && npm ci && npm start` で App を起動する。
  - `package-lock.json` がない場合は `npm install` を利用する。
  - Node.js はリポジトリルートの `package.json` に `engines` 記載がある場合はそれを満たすものを利用する。
  - タスクリストのセルをダブルクリックで編集 → Enter で確定する。
  - 編集確定後もセル表示が変わらない（`tasks` が更新されないため）。
- 参考: `onTaskUpdate` は `setTasks` により状態更新するが、`onCellCommit` からは直接呼ばれていない（`example/src/App.tsx:L147-L150`）。

### 8.7 仮説
- H1: `onCellCommit` が no-op の場合、編集確定後に `tasks` が更新されずセル表示が更新されない。
  - 編集は `onUpdateTask` と `onCellCommit` の両方が `undefined` ではない場合に有効化される。
  - `onUpdateTask` は編集可否の判定に使われ、`onCellCommit` は確定処理のみを担う。
  - そのため両者は直接連携しない（`src/components/task-list/task-list-table.tsx:L53-L55`, `src/components/task-list/task-list.tsx:L249-L275`）。
- H2: 編集開始はダブルクリック/Enter/キー入力だが、コミット時の `CellCommitTrigger` が現状 `enter` のみのため、編集開始の起点の違いを `onCellCommit` 側で判別できない。
  - `CellCommitTrigger` は型定義上 `enter` のみで、`OverlayEditor` も `enter` を送出（`src/types/public-types.ts:L18-L25`, `src/components/task-list/overlay-editor.tsx:L302-L311`）。
- H3: `headerProps`/`tableProps` の再生成が頻繁な場合、スクロールや選択で再レンダーが増える可能性がある。
  - props/columnIds は memo 化されていない（`src/components/task-list/task-list.tsx:L181-L206`, `src/components/task-list/task-list-table.tsx:L47-L74`）。

### 8.8 推奨事項
- 例: `onCellCommit` で `setTasks`/`onTaskUpdate` を呼び、編集値を反映する実装例をドキュメント化する。
- 編集起点を識別したい場合は `CellCommitTrigger` を拡張し、`editingState.trigger` を `onCellCommit` に渡す設計を検討する。
- 大規模データで性能問題が出る場合は `tableProps`/`columnIds` の `useMemo` 化や `React.memo` を検討する。
