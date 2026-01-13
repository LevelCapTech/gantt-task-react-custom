# 30 Coding Standards — コーディング規約

- `.github/instructions/**/*.instructions.md` のパス別ルールを優先する。
- 互換性維持をデフォルトとし、破壊的変更は移行策・理由を plan / ADR に記載する。
- Python: 型ヒント必須、例外は無視せずログを記録して再送出し、`print` ではなく構造化ログを使う。
- 依存追加は最小限とし、バージョンをピン止めして `requirements.txt` / `constraints` に反映する。
- ログ/コメント/Doc は簡潔に。秘密情報・個人情報をログやコメントに残さない。
- テスト可能な構造（副作用を分離、関数・メソッドを小さく）を心掛ける。
- コミットメッセージ:
  - `.github/instructions/commit-messages.instructions.md` を唯一の参照源とし、Copilot 生成を含む全コミットで同じ日本語・プレフィックス・3行構造ルールを適用する。
