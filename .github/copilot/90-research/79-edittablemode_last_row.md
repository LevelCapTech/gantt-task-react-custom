# 79-edittablemode_last_row: Task Table 最下段の編集不可調査

本ドキュメントは [RESEARCH] Issue における調査結果をまとめたものです。仕様の入口は [00-index.md](../00-index.md) を参照してください。

## 1. 機能要件 / 非機能要件
- 機能要件:
  - 最下段セルが `not-editable` になる原因（どの条件が false か）を特定できる状態にする。
  - 修正方針を 1〜2 行で説明できる入力（DESIGN への引き継ぎ）を用意する。
- 非機能要件:
  - 調査ドキュメントのみ追加し、既存コードの挙動は変更しない。
  - Secrets / PII を記載しない。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）: `.github/copilot/90-research/79-edittablemode_last_row.md`（新規）
- 影響範囲・互換性リスク: なし（調査ドキュメントのみ）。
- 外部依存・Secrets の扱い: 追加なし。

## 3. 設計方針
- 責務分離 / データフロー:
  - `TaskListTable` の `isCellEditable` がテーブル/列/行の条件で editable 判定を行うため、判定根拠の確定に焦点を当てる。
- エッジケース / 例外系 / リトライ方針:
  - 最下段のみ「行データが別ルート（footer 等）」の可能性を切り分ける。
- ログと観測性（漏洩防止を含む）:
  - 追加ログは boolean 値のみを出力し、入力値は出さない（`rowId/columnId` は既存ログ同等）。

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
- 未確定事項:
  - 実際の再現データで `isDisabled` が true になっているか確認が必要。
- ADR に残すべき判断:
  - `isDisabled` と編集可否の関係を変更する場合は ADR 候補。

## 8. 調査結果

### 8.1 事実と根拠（ログ / コード / 再現手順）
- 既存ログ:
  - `select cell` が発生しており、最下段セル自体の選択は成功している（Issue 記載ログ）。
  - 編集開始が `not-editable` で拒否されている（Issue 記載ログ）。
- `TaskListTable` の編集判定:
  - `isCellEditable` は `tableEditable && columnEditable && rowEditable && cellEditableByRule` を返す（`src/components/task-list/task-list-table.tsx:L75-L81`）。
  - `rowEditable` は `task.isDisabled !== true` で判定される（同上）。
- Example データ:
  - 最下段 `Task 9`（タスク名: `打ち上げ`）は `isDisabled: true` が設定されている（`example/src/helper.tsx:L188-L209`）。
  - そのため Example では `rowEditable=false` となり編集不可が再現する。

### 8.2 原因仮説の切り分け結果
- 仮説A: `rowEditable=false`（`task.isDisabled === true`）
  - Example データで該当し、最下段のみ編集不可の直接原因と一致。
- 仮説B: `columnEditable=false`
  - すべての列で編集不可という現象と矛盾しないが、列は `visibleFields` から構築されており最下段のみ false になる根拠がない。
- 仮説C: `rowId/columnId` の解決失敗
  - 既存ログで `rowId: 'Task 9'` が取得されており、解決失敗の兆候は現状なし（追加ログで要確認）。
- 仮説D: `isCellEditable` のデフォルト挙動が false 扱い
  - 現行実装は `cellEditableByRule` が常に true であり、未指定時に false になる経路はない。

### 8.3 選択肢（Pros/Cons）と推奨案
1. **データ側で `isDisabled` を外す（行編集を許可）**
   - Pros: 変更範囲が最小で意図通り編集が可能になる。
   - Cons: `isDisabled` の他機能（ドラッグ/削除制御）も同時に有効になるため、行全体の無効化意図がある場合は不適切。
2. **編集のみ例外扱い（新フラグ/判定変更）**
   - Pros: 既存の `isDisabled` を保持しつつ編集だけ許可できる。
   - Cons: 仕様追加（新プロパティ/判定ロジック変更）が必要で、影響範囲が広がる。
3. **最下段が別行である場合の解決ロジック修正**
   - Pros: もし `rowId` 解決ミスが原因なら根治できる。
   - Cons: 追加ログでの事実確認が前提（現状は裏付け不足）。

推奨案: **実データで `isDisabled` が true になっているかをログで確定し、該当する場合はデータ修正（案1）を第一候補**とする。`isDisabled` を保持したい要件がある場合のみ案2を検討する。

### 8.4 次アクション（DESIGN へ渡す入力）
- `isCellEditable` 内で下記 boolean をログ出力し、最下段で false になる条件を 1 回のログで確定する。
  - `tableEditable / columnEditable / rowEditable / isCellEditableProvided / isCellEditableResult / editable`
- 追加ログにより `rowEditable=false` が確定した場合:
  - `isDisabled` を編集禁止に使う仕様を確認し、**データ修正**か**編集許可の例外化**かを DESIGN で判断する。
- もし `rowId` 解決失敗が判明した場合:
  - `tasks.find` の結果と `data-row-id` の整合を DESIGN で再設計する。
