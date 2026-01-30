# 1. 機能要件 / 非機能要件
- 機能要件:
  - GitHub Actions で PR / main push / workflow_dispatch に対して `npm test` を実行する CI を追加する。
  - 既存の `setup-labels` Workflow を削除する。
- 非機能要件:
  - 権限は `contents: read` の最小権限とする。
  - Node.js 20 と `npm ci` を使用し、Secrets を使わない。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 新規: `.github/workflows/ci.yml`
  - 削除: `.github/workflows/setup-labels.yml`
  - 新規: `.github/copilot/plans/99-implementation-plan.md`
- 影響範囲・互換性リスク:
  - 既存のテスト実行方法に影響なし。CI 実行が追加されるのみ。
- 外部依存・Secrets の扱い:
  - `actions/checkout` / `actions/setup-node` のみ利用。Secrets 不要。

# 3. 設計方針
- 責務分離 / データフロー:
  - 単一ジョブで `npm ci` → `npm test` を実行する。
- エッジケース / 例外系 / リトライ方針:
  - `concurrency` を設定し、同一 PR/ブランチの重複実行を防止する。
- ログと観測性:
  - 標準出力のみ。Secrets を扱わない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - `npm test` が CI で実行されることを確認する。
- モック / フィクスチャ方針:
  - 追加なし。
- テスト追加の実行コマンド:
  - `npm test`

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm test`
- 通過基準と失敗時の対応:
  - `npm test` が成功すること。失敗時は該当テストを修正する。

# 6. ロールアウト・運用
- ロールバック方法:
  - 追加した Workflow を削除し、削除した Workflow を戻す。
- 監視・運用上の注意:
  - GitHub Actions の実行結果を確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - なし。
- ADR に残すべき判断:
  - なし。
