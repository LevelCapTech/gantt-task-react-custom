# 1. 機能要件 / 非機能要件
- 機能要件: gh-pages デプロイ時に checkout で消える example/build を退避し、復元してデプロイできるようにする。
- 非機能要件: 既存のビルド・デプロイ手順を維持し、Secrets や権限設定を変更しない。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）: `.github/workflows/gh-pages.yml`（Deploy to gh-pages ステップの退避処理追加）、`.github/copilot/plans/96-implementation-plan.md`（本計画）。
- 影響範囲・互換性リスク: gh-pages デプロイ処理のみ。成果物のコピー手順を追加するだけで互換性リスクは低い。
- 外部依存・Secrets の扱い: 追加なし。RUNNER_TEMP のみ利用。

# 3. 設計方針
- 責務分離 / データフロー: Deploy ステップ内で checkout 前に成果物を RUNNER_TEMP に退避し、checkout 後に復元する。
- エッジケース / 例外系 / リトライ方針: `example/build` が存在しない場合は既存の Validate step で失敗させる。退避先は都度削除して再作成する。
- ログと観測性（漏洩防止を含む）: 退避先パスのみを使用し、Secrets を出力しない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）: 既存の CI ワークフローでデプロイが継続できることを確認する。
- モック / フィクスチャ方針: 追加なし。
- テスト追加の実行コマンド（例: `python -m pytest`）: `npm test`。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）: `npm test`（lint/build/unit を含む）。
- 通過基準と失敗時の対応: すべて成功すること。失敗時は workflow 変更箇所を見直す。

# 6. ロールアウト・運用
- ロールバック方法: `gh-pages.yml` を変更前に戻す。
- 監視・運用上の注意: デプロイログで退避・復元が成功しているか確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項: なし。
- ADR に残すべき判断: なし（ワークフロー手順の小規模修正）。
