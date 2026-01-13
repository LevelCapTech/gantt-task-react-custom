# Copilot 規範層（全タスク共通で短く強い指示）
- 仕様の入口は `.github/copilot/00-index.md`。参照順に従い、設計→実装の2段階ループを厳守する。
- コード/ドキュメントは **完全実装**で提出し、擬似コード・未完成サンプルは禁止。出力は必要最小限の差分にとどめる。
- **PRタイトルは必ず日本語で記述すること。**（例: `feat: 新しい認証処理の追加` のように、日本語で目的を明示する。）
- コミットメッセージは `.github/instructions/commit-messages.instructions.md` に従い、日本語・`fix:`/`hotfix:`/`feat:` のプレフィックス付きで3行以上の構造を守ること（Copilot 生成分も含む）。
- Secrets・個人情報をコード/ログ/ドキュメントに出さない。ログは構造化し、例外は握り潰さず意味のあるメッセージで扱う。
- 互換性を壊さない方針がデフォルト。破壊的変更が必要なときは移行策を plan に明記する。
- 実装前に `.github/copilot/80-templates/implementation-plan.md` を満たす plan を作成・確認する（設計Issue）。実装Issueでは plan から逸脱しない。
- 型・例外・入力検証・テスト追加を必須とし、`.github/instructions/**/*.instructions.md` の実務ルールを守る。
- Done 定義: lint / typecheck / test / security など CI 品質ゲートが全て緑、受入条件をテストで担保、関連ドキュメントを更新すること。
