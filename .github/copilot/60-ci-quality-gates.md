# 60 CI Quality Gates — 必須ジョブと基準

## 必須ジョブ（例）
- **format**: `black .`（またはプロジェクト指定のフォーマッタ）
- **lint**: `ruff check .` など静的解析を実行
- **typecheck**: `mypy .` で型整合性を確認
- **test**: `python -m pytest` でユニット/回帰テストを実行
- **security**: `pip-audit -r requirements.txt` など依存脆弱性スキャン

## 運用ルール
- すべての必須ジョブをブランチ保護の required status checks に設定し、失敗時はマージ不可。
- CI ログに Secrets/PII を出さない。必要な権限のみを `permissions` で明示する。
- キャッシュや並列実行は再現性を損なわない範囲で利用し、結果が変わる場合は無効化する。
- 品質ゲートで検出した問題は plan / PR に反映し、再現手順と修正内容を残す。
