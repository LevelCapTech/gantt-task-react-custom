# 1. 機能要件 / 非機能要件
- 機能要件:
  - 旧タグ運用の背景として、フォーク時は upstream の命名制約を避けるため `release_levelcaptech/vX.Y.Z` を採用していた点を明文化する。
  - フォーク解除により制約が解消されたため、タグ命名規則を `vMAJOR.MINOR.PATCH` に統一する。
  - 新タグ命名規則を SemVer 準拠（MAJOR.MINOR.PATCH）かつ `v` プレフィックス必須として正式定義する。
  - `npm version` 実行時に生成されるタグ（既定は `vX.Y.Z`）と矛盾しないリリース手順へ統一する。
  - CI と GitHub Releases におけるタグ参照を `vX.Y.Z` 前提に更新する方針を明記する。
  - 既存の `release_levelcaptech/vX.Y.Z` タグは削除せず、後方互換として保持する。
- 非機能要件:
  - 既存タグの削除や GitHub Release UI での再作業を行わない。
  - 新旧タグが混在しても誤作動しないよう、CI のタグトリガ条件を明確化する。
  - 互換性を壊さない方針を維持し、移行は段階的に周知する。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - `.github/copilot/plans/tag-strategy-implementation-plan.md`（新規、設計のみ）。
- 実装時に想定される変更対象（ドキュメント修正対象範囲）:
  - `.github/workflows/npm-publish.yml`（タグトリガ条件・バージョン検証の更新）。
  - `docs/npm-publish.md`（旧タグ運用の記述更新）。
  - リリース手順に言及する関連ドキュメント（README 等）があれば同様に更新。
- 影響範囲・互換性リスク:
  - リリースタグ命名規則と CI トリガ条件のみが影響対象。既存タグは残すため後方互換を維持する。
- 外部依存・Secrets の扱い:
  - 追加依存は不要。Secrets は既存運用のまま。
- In Scope:
  - タグ命名規則、リリースフロー定義、CI タグトリガ条件の確認、ドキュメント修正対象範囲の明確化。
- Out of Scope:
  - 実際のドキュメント修正、既存タグ削除、GitHub Releases UI 操作。

# 3. 設計方針
- 責務分離 / データフロー:
  - 命名規則の SSOT はリリース手順ドキュメントと CI ワークフローに置き、どちらも `vX.Y.Z` を前提に揃える。
- 旧運用の背景:
  - フォーク時は upstream 側のタグ命名と衝突を避けるため `release_levelcaptech/` プレフィックスを導入していた。
- 新タグ命名規則の正式定義:
  - 形式: `vMAJOR.MINOR.PATCH`（SemVer 準拠、`v` プレフィックス必須）。
  - 例: `v1.2.3`。
  - `release_levelcaptech/` プレフィックスは新規タグでは使用しない。
- npm version との整合性:
  - `npm version` は既定で `vX.Y.Z` タグを生成するため、新ルールと一致する。
  - 現行フローで `--no-git-tag-version` を使っているかを確認し、手動 `git tag` が必要かどうかを確定したうえで運用手順を統一する。
  - 既定の `npm version` を使う場合は重複タグ作成を避けるため、`git tag` 実行の要否を明確化する。
- CI / GitHub Releases への影響:
  - `npm-publish` ワークフローの tag トリガを `v*.*.*` に更新し、旧タグでは発火しないよう明記する。
  - `.github/workflows/npm-publish.yml` 内のタグ検証ロジック（例: `EXPECTED_VERSION="${GITHUB_REF#refs/tags/release_levelcaptech/v}"` によるタグ文字列の切り出しや、"Expected release_levelcaptech/vX.Y.Z" といったエラーメッセージ）は、新しいタグ命名規則に合わせて `refs/tags/vX.Y.Z`・"Expected vX.Y.Z" 前提の実装へ更新する。
  - 上記のトリガ条件・タグ検証ロジック・エラーメッセージの変更内容を `docs/npm-publish.md` のリリース手順に反映し、運用手順と CI 実装に差分が出ないようにする。
  - GitHub Releases は新タグ `vX.Y.Z` を基準に作成する。旧タグは履歴として保持する。
- 後方互換の扱い:
  - 既存の `release_levelcaptech/vX.Y.Z` タグは削除せず残す。
  - 新しい運用では旧タグを使わないが、過去リリースの参照性は維持する。
- 実装イメージ（旧運用）:
  - Issue 記載の手順を転記した例（運用の前提は「7. オープンな課題」で確認する）。
  ```
  npm version 1.2.3
  git push
  git tag release_levelcaptech/v1.2.3
  git push origin release_levelcaptech/v1.2.3
  ```
- 実装イメージ（新運用）:
  - Issue 記載の手順を転記した例（運用の前提は「7. オープンな課題」で確認する）。
  ```
  npm version 1.2.3
  git push
  git tag v1.2.3
  git push origin v1.2.3
  ```
- エッジケース / 例外系 / リトライ方針:
  - `v` プレフィックス無しや SemVer 形式外のタグは CI で明示的に拒否する。
  - 旧タグが残っていても、新規ワークフローが誤発火しないことを確認する。
- ログと観測性（漏洩防止を含む）:
  - タグ名と version の不一致のみを出力し、Secrets をログに含めない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常系: `v1.2.3` タグ push で CI が発火する。
  - 例外系: `release_levelcaptech/v1.2.3` タグ push では新ワークフローが発火しない。
  - 境界系: `v1.2` や `1.2.3` などの不正形式タグは拒否される。
  - 回帰: `npm version` 実行後のタグ名が新ルールと一致する。
- モック / フィクスチャ方針:
  - CI トリガは GitHub Actions 実行で確認するためモックは不要。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - 実装時は `npm test` を実行し、ワークフロー変更による既存影響がないことを確認する。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm test`（unit + lint + build）
- 通過基準と失敗時の対応:
  - 既存テストが成功すること。失敗時はタグ検証ロジックやドキュメント記述の差分を見直す。
  - CI の tag トリガ条件は `.github/workflows` 全体を確認し、想定外の発火がないことを点検する。

# 6. ロールアウト・運用
- ロールバック方法:
  - ワークフローとドキュメントを旧タグ仕様に戻すコミットを revert する。
- 監視・運用上の注意:
  - 新規リリースで `vX.Y.Z` タグが正しく push され、旧タグでは発火しないことを確認する。
  - 既存タグは削除しない方針を明示する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - 既存運用で `npm version` を `--no-git-tag-version` 付きで実行しているかを確認する（Issue の手順が手動 `git tag` 併用を前提としているため）。
  - Issue に `121-semver-tagging-implementation-plan.md` の記載があるため、成果物ファイル名の最終確認が必要。
  - `npm-publish` 以外に tag で発火する CI が存在するかを洗い出す。
- ADR に残すべき判断:
  - なし（運用方針の変更のみのため）。
