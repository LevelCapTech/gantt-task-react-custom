## 1. 機能要件 / 非機能要件
- 機能要件:
  - `@dnd-kit/core` を導入し、将来的にドラッグ&ドロップ機能を追加できる基盤を整える（本Issueでは機能組み込みは行わない）。
  - `@dnd-kit/utilities` を導入し、コアと併せて最小限のユーティリティを利用可能にする。
- 非機能要件:
  - 依存追加後も `npm test`（lint/typecheck/build/unit）をすべて通過できること。
  - microbundle 出力サイズの増加を +100KB 未満に抑制すること。
  - Node>=10, React^18 との互換性を維持すること。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）: 本計画ファイル（新規）。依存追加は別Issue/PRで実施し、本PRでは計画のみ提示。
- 影響範囲・互換性リスク: ライブラリ本体コード無変更。依存追加を想定した事前検討のみ。Node>=10, React^18 互換を維持。
- 外部依存・Secrets の扱い: 本PRでは依存追加なし。Secrets は扱わない。

## 3. 設計方針
- 責務分離 / データフロー: 本Issueではライブラリコードへ組み込みを行わず、導入パッケージと整合性確認手順の設計のみを示す。
- エッジケース / 例外系 / リトライ方針: 依存解決失敗時はバージョン固定を見直し、`npm ci` により再現性を確保する想定。
- ログと観測性（漏洩防止を含む）: 追加ログなし。`npm ls` で依存整合を確認し記録する。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）: 依存追加後も既存のビルド・lint・ユニットテストが通過することを確認。バンドルサイズが +100KB 未満であることを目視確認。
- モック / フィクスチャ方針: 既存テストを流用。コード変更なしのため新規テスト追加なし。
- テスト追加の実行コマンド: 依存導入後に `npm test`（`test:unit` / `test:lint` / `test:build` を包含）を実行する想定。補足として `npm run lint` を単体実行し警告のみでエラーなしを確認。

## 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）: 依存導入後に `npm test` を実行し lint/typecheck/build/unit を確認。`npm run lint` を追加実行し、lint 警告のみでエラーがないことを確認。セキュリティスキャンは現行方針を継続し `npm audit --production` を実行。
- 通過基準と失敗時の対応: すべて成功すること。失敗時は依存バージョンの互換性を見直し、必要ならロールバック。

## 6. ロールアウト・運用
- ロールバック方法: 依存追加を行った場合は `package.json`/`package-lock.json` の変更をリバートし `npm ci` を実行。
- 監視・運用上の注意: なし（本PRでは機能追加なし）。バンドルサイズをリリース前に確認。

## 7. オープンな課題 / ADR 要否
- 未確定事項: なし（本PRは計画のみ）。
- ADR に残すべき判断: 依存導入を実施する際にバンドルサイズや Node バージョン方針を変更する場合は ADR 化する。

## 9. 検証ログ（実施結果）
- npm test: pass（lint 2 warning / error 0, build pass, unit pass）
- npm run lint: warning 2（既存 Hook 依存警告） / error 0
- npm audit --production: 0 vulnerabilities
- dist size: index.js 104K, index.modern.js 102K（増加 +100KB 未満）
- peerDependencies: @dnd-kit/core ^6.3.1, @dnd-kit/utilities ^3.2.2（lockと整合）

## 8. dnd-kit パッケージ一覧と追加判断

| パッケージ名 | 内容 | 新規追加判断結果 | 判断の理由 |
| --- | --- | --- | --- |
| @dnd-kit/core | DnD の基盤（センサー/コンテキスト） | 追加予定 | 最小構成の基盤として必須。 |
| @dnd-kit/utilities | ユーティリティ群 | 追加予定 | core と併用する基本ユーティリティのため。 |
| @dnd-kit/sortable | ソート機能拡張 | 未追加（本Issue範囲外） | ソートUI実装はスコープ外のため後続で検討。 |
| @dnd-kit/modifiers | 位置補正・制約ユーティリティ | 未追加（本Issue範囲外） | 具体的なドラッグ挙動実装がないため不要。 |
| @dnd-kit/accessibility | アクセシビリティ拡張 | 未追加（本Issue範囲外） | 今回は計画段階かつ UI 実装なしのため後続で検討。 |
