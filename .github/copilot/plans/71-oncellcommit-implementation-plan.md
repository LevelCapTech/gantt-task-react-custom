# Implementation Plan: example App onCellCommit 最小実装

## 1. 機能要件 / 非機能要件
- 機能要件:
  - example App の `onCellCommit` で `rowId / columnId / value` を受け取り、該当タスクを更新する。
  - 日付系カラムは `new Date(value)`、数値系カラムは `Number(value)` に変換する。
  - state 更新は `setTasks(prev => prev.map(...))` の非破壊更新とする。
- 非機能要件:
  - ライブラリ本体（`src/`）を変更しない。
  - 既存の example 機能に影響を与えない最小差分に留める。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 修正: `example/src/App.tsx`
  - 新規: `/.github/copilot/plans/71-oncellcommit-implementation-plan.md`
- 影響範囲・互換性リスク:
  - example App のみ。タスク更新の参照が変わるため互換性リスクは低い。
- 外部依存・Secrets の扱い:
  - 追加依存なし。Secrets 取り扱いなし。

## 3. 設計方針
- 責務分離 / データフロー:
  - `onCellCommit` で payload を受け取り、`setTasks` の map で対象タスクを更新する。
  - `columnId` に応じて最小限の型変換を行い、更新対象フィールドのみ差し替える。
- エッジケース / 例外系 / リトライ方針:
  - 無効な `rowId` はそのまま返し、既存動作を維持する（追加のバリデーションは行わない）。
  - `columnId` が想定外の場合は `value` をそのまま反映する。
- ログと観測性（漏洩防止を含む）:
  - 入力値はログ出力しない。既存ログは維持する。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 例: ダブルクリック→編集→Enter で表示が更新されることを手動確認する。
  - テスト追加はスコープ外のため行わない。
- モック / フィクスチャ方針:
  - 追加なし。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm test`
  - `cd example && npm test -- --watch=false`

## 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm test`
  - `cd example && npm test -- --watch=false`
- 通過基準と失敗時の対応:
  - 既存の lint/build/test が成功すること。失敗時は該当差分のみ修正する。

## 6. ロールアウト・運用
- ロールバック方法:
  - `onCellCommit` を no-op に戻す。
- 監視・運用上の注意:
  - example の編集確定後に表示が更新されることを確認する。

## 7. オープンな課題 / ADR 要否
- 未確定事項:
  - なし。
- ADR に残すべき判断:
  - なし。
