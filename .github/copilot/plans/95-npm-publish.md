# Implementation Plan

## 1. 機能要件 / 非機能要件
- 機能要件:
  - npm publish ワークフローでタグと `package.json` の version 一致を検証する。
  - release タグの形式を検証し、不正な形式はエラーで停止する。
  - npm publish 手順ドキュメントの自動処理説明を最新の挙動に合わせる。
- 非機能要件:
  - 既存の publish フローに影響を与えない最小変更とする。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - `.github/workflows/npm-publish.yml`（修正）
  - `docs/npm-publish.md`（修正）
  - `.github/copilot/plans/95-npm-publish.md`（新規）
- 影響範囲・互換性リスク:
  - タグと version が不一致の場合に publish を停止する。
- 外部依存・Secrets の扱い:
  - 既存の OIDC のみを利用し、追加の Secrets は不要。

## 3. 設計方針
- 責務分離 / データフロー（必要なら Mermaid 1 枚）:
  - `package.json` を SSOT とし、タグ一致のみを検証する。
- エッジケース / 例外系 / リトライ方針:
  - タグと version 不一致時は明示的にエラーで停止する。
  - タグ形式が不正な場合は明示的にエラーで停止する。
- ログと観測性（漏洩防止を含む）:
  - version 不一致の情報のみを出力し、Secrets は出さない。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - ドキュメントとワークフロー変更のため新規テストは追加しない。
- モック / フィクスチャ方針:
  - なし。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm run test`

## 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm run test`
- 通過基準と失敗時の対応:
  - 既存テストが成功すること。失敗時は原因を記録して修正する。

## 6. ロールアウト・運用
- ロールバック方法:
  - 対象コミットの revert。
- 監視・運用上の注意:
  - タグと version の一致が保たれているか確認する。

## 7. オープンな課題 / ADR 要否
- 未確定事項:
  - なし。
- ADR に残すべき判断:
  - なし。
