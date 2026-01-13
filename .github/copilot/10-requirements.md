# 10 Requirements — 要件とスコープ

## 目的
- Copilot / 自動エージェントが参照する仕様を一元化し、設計→実装の再現性を高める。

## スコープ
- **In Scope**: `.github/copilot/` 配下の仕様整備、`.github/instructions/**/*.instructions.md` の実務指示、plan / PR / review テンプレート。
- **Out of Scope**: CI/CD ジョブ実装や既存アプリのリファクタリング（別 Issue で扱う）。

## 機能要件
- 仕様ファイルが二層構造（規範層と仕様層）で整理され、参照順が明示されていること。
- 80-templates/implementation-plan.md を用いた設計出力が必須であること。
- CI 品質ゲート（lint / typecheck / test / security）が文書化されていること。

## 非機能要件
- **再現性**: 同一 plan から同一成果物を得られる。
- **自動化**: CI で品質ゲートを通過しない限りマージ不可（ブランチ保護を前提）。
- **セキュリティ**: Secrets/PII をログ・差分に出さない。
- **拡張性**: ファイル単位で改訂しやすく、重複を避ける。

## 受入条件
- `copilot-instructions.md` が短く強い規範として完成している。
- `10-60` それぞれに最小構成の内容があり、`00-index` から辿れる。
- `80-templates/implementation-plan.md` が設計出力に利用されている。
- CI 品質ゲートの最低要件が文書化されている。

## 未確定事項（決定方針）
- CI 実行基盤: チームの運用基盤（GitHub Actions 等）に合わせて選定。
- ADR の命名規約: 連番方式（例: `ADR-0001-title.md`）を基本とし、テンプレート `ADR-0001-template.md` と統一する。
