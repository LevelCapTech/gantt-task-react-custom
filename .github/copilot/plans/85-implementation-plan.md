# 1. 機能要件 / 非機能要件
- 機能要件:
  - `example/` の React アプリを GitHub Actions でビルドし、成果物を `gh-pages` ブランチへデプロイする設計を確定する。
  - GitHub Pages 公開 URL を `https://levelcaptech.github.io/gantt-task-react-custom/` とし、README から辿れる前提を明記する。
  - build / deploy 失敗時は `gh-pages` を更新しない運用方針を明文化する。
- 非機能要件:
  - Secrets を扱わず、`GITHUB_TOKEN` のみを利用する前提とする。
  - 既存のライブラリ本体や example UI の挙動変更は行わない。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 新規: `.github/copilot/plans/85-implementation-plan.md`（本計画書のみ）。
- 影響範囲・互換性リスク:
  - 設計ドキュメントのみの追加で、実装・挙動には影響しない。
- 外部依存・Secrets の扱い:
  - 追加依存なし。Secrets/PII を記載しない。

# 3. 設計方針
- 責務分離 / データフロー（必要なら Mermaid 1 枚）:
  - デプロイ責務は GitHub Actions、配信責務は GitHub Pages に分離する設計とする。
  - データフローは既存 Issue の mermaid 図を踏襲し、実装 Issue で workflow 化する。
- エッジケース / 例外系 / リトライ方針:
  - build 失敗時は workflow を fail し、`gh-pages` を更新しない。
  - deploy 失敗時も `gh-pages` を更新せず、Actions ログに原因を残す。
- ログと観測性（漏洩防止を含む）:
  - `GITHUB_TOKEN` のみを利用し、ログに Secrets/PII を出力しない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 設計フェーズのためテスト実装は行わない。実装 Issue で build / deploy の確認を行う。
- モック / フィクスチャ方針:
  - 実装 Issue で必要に応じて検討する。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - 実装 Issue で `npm run build` / `npm run test` を検討する。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - 実装 Issue で repository 既存の `npm run test` を実行する。
- 通過基準と失敗時の対応:
  - build / lint / test が成功すること。失敗時は実装 Issue で原因を修正する。

# 6. ロールアウト・運用
- ロールバック方法:
  - `gh-pages` ブランチを前回の commit に戻す（Actions での再デプロイを停止）。
- 監視・運用上の注意:
  - `main` ブランチ更新時に workflow が自動実行されるよう設計し、失敗時はログを確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - Node.js / npm の固定バージョン（`example/package.json` または既存 CI を参照して実装 Issue で決定）。
  - GitHub Pages の公開ブランチ設定はリポジトリ管理者が行う（設定項目として明記）。
- ADR に残すべき判断:
  - ADR は不要。理由: 設計は運用手順の整理であり、公開 API や実装仕様の変更を伴わないため。

# 8. 実装 Issue への引き渡し事項
- GitHub Actions workflow 設計:
  - `main` push トリガーで example を build し、`gh-pages` に成果物を配置する。
  - `permissions` は `contents: write` を明示し、`GITHUB_TOKEN` のみを利用する。`deploy-pages` を採用する場合は `pages: write` と `id-token: write` を追加する。
  - `concurrency` を設定して二重実行を防止する。
- `example` ビルド前提:
  - `example/package.json` に `homepage` として上記 URL を設定する。
  - build コマンドは `cd example && npm ci && npm run build` を基本とする。
- `gh-pages` ブランチ運用方針:
  - build 失敗時は `gh-pages` を更新しない。
  - gh-pages は成果物のみを保持し、手動変更は行わない。
- README 反映:
  - ルート README に GitHub Pages URL を記載する（既存ライブデモリンクの置換または併記）。
- 失敗時挙動・運用ルール:
  - Actions 失敗時はログを確認し、次回成功まで公開状態は維持される。

# 9. 参照
- [00-index.md](../00-index.md)
- [80-templates/implementation-plan.md](../80-templates/implementation-plan.md)
