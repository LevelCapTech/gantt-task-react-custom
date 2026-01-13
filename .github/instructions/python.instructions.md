---
name: Python implementation rules
description: apps 配下の Python コードに適用する実務ルール
applyTo:
  - "apps/**/*.py"
---
- 型ヒントは必須。例外は文脈を残して再送出し、`print` ではなく `logging` で構造化ログを出す。
- Secrets/トークン/PII をログ・コメント・テストデータに含めない。環境変数や Vault で注入し、マスクを徹底する。
- 副作用を分離し、小さな関数でテストしやすい構造にする。入力検証を行い、失敗は明示的に返す。
- 依存追加は最小限にし、バージョンをピン止めして `requirements.txt` に反映する。
- 変更時は必ずテストを追加/更新し、最低限、以下のコマンドを実行する: `python -m pip install -r requirements.txt`, `black .`, `ruff check .`, `mypy .`, `python -m pytest`.
