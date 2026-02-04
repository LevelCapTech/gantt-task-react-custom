# 1. 機能要件 / 非機能要件
- 機能要件:
  - GitHub Actions で `main` 更新時に `example/` を production build し、成果物を `gh-pages` ブランチへ配置できること。
  - GitHub Pages の公開 URL を `https://levelcaptech.github.io/gantt-task-react-custom/` として公開できること。
  - build / deploy 失敗時に `gh-pages` を更新せず、直前の公開状態を保持できること。
- 非機能要件:
  - Secrets を扱わず、`GITHUB_TOKEN` のみを利用する前提とする。
  - 既存のライブラリ本体や example UI の挙動変更は行わない。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 公開対象: `example/build/` の静的成果物（HTML / JS / CSS / assets）。
  - 公開ブランチ: `gh-pages`（成果物のみを配置）。
- 影響範囲・互換性リスク:
  - 設計ドキュメントのみの追加で、実装・挙動には影響しない。
- 外部依存・Secrets の扱い:
  - 追加依存なし。Secrets/PII を記載しない。

# 3. 設計方針
- 責務分離 / データフロー（必要なら Mermaid 1 枚）:
  - デプロイ責務は GitHub Actions、配信責務は GitHub Pages に分離する設計とする。
  - データフロー（GitHub Pages 自動公開）:
    ```mermaid
    flowchart LR
      Dev[Developer push] --> GA[GitHub Actions]
      GA --> Build[example build]
      Build --> GHP[gh-pages branch]
      GHP --> Pages[GitHub Pages]
      Pages --> User[Browser]
    ```
- エッジケース / 例外系 / リトライ方針:
  - build 失敗時は workflow を fail し、`gh-pages` を更新しない。
  - deploy 失敗時も `gh-pages` を更新せず、Actions ログに原因を残す。
  - 成果物が空の場合は deploy しない（`example/build/` の生成失敗を検知して fail）。
- ログと観測性（漏洩防止を含む）:
  - `GITHUB_TOKEN` のみを利用し、ログに Secrets/PII を出力しない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 設計レビュー観点として、workflow の dry-run（手動実行）で build と deploy が通ることを確認する。
- モック / フィクスチャ方針:
  - 設計ドキュメントでは不要。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `cd example && npm ci && npm run build`（workflow と同一条件で確認）。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - 実装 Issue で repository 既存の `npm run test` を実行する。
- 通過基準と失敗時の対応:
  - build / lint / test が成功すること。失敗時は実装 Issue で原因を修正する。

# 6. ロールアウト・運用
- ロールバック方法:
  - 第一手順: `gh-pages` ブランチを前回の commit に戻す。
  - 問題が継続する場合: workflow を一時停止し、原因となった `main` の変更をリバートして再デプロイを防ぐ。
- 監視・運用上の注意:
  - `main` ブランチ更新時に workflow が自動実行されるよう設計し、失敗時はログを確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - Node.js は `.travis.yml` に合わせて 10/12 系を優先し、実装 Issue では 12.x を指定する方針で確定する。
  - GitHub Pages の公開ブランチ設定はリポジトリ管理者が行う（設定項目として明記）。
- ADR に残すべき判断:
  - ADR は不要。理由: 設計は運用手順の整理であり、公開 API や実装仕様の変更を伴わないため。

# 8. 実装 Issue への引き渡し事項
- GitHub Actions workflow 設計:
  - トリガー: `main` push と `workflow_dispatch`。
  - 実行環境: `ubuntu-latest`、Node.js 12.x、npm 使用。
  - Build 手順:
    1. `actions/checkout@<pin>` でリポジトリ取得。
    2. `actions/setup-node@<pin>` で Node.js 12.x を設定。
    3. `cd example && npm ci` を実行。
    4. `npm run build` で `example/build/` を生成。
  - Deploy 手順:
    1. `gh-pages` ブランチを checkout し、成果物以外を削除。
    2. `example/build/` をリポジトリ直下へ配置。
    3. `git commit` → `git push` で `gh-pages` を更新。
  - 権限/制御:
    - `permissions: { contents: write }` を明示し、`GITHUB_TOKEN` のみを利用する。
    - `concurrency` で同一 workflow の同時実行を抑止する。
- `example` ビルド前提:
  - `example/package.json` に `homepage: "https://levelcaptech.github.io/gantt-task-react-custom/"` を設定する。
  - build コマンドは `cd example && npm ci && npm run build` を基本とする。
  - ローカル検証では `npm start` を使用し、`homepage` 設定は本番ビルドのパス解決にのみ影響するため開発サーバーの動作には影響しない。
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
