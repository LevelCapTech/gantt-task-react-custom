# 1. 機能要件 / 非機能要件
- 機能要件:
  - `task-list-header.tsx` に日本語固定ラベル（タスク名/開始日/終了日/工程/担当者/予定開始/予定終了/予定工数/実績工数/ステータス）を内蔵し、`Gantt` デフォルトで日本語ヘッダーが表示されること。
  - example 側から `TaskListHeader` 明示指定を削除しても表示結果が変わらないこと。
  - `TaskListHeader` Props 構造は維持し、外部指定で上書き可能とすること。
- 非機能要件:
  - 多言語切替は行わず、日本語を標準ロケールとして固定する。
  - 後方互換性を保ち、既存 props でのカスタムヘッダー指定を許容する。
  - Secrets/PII を扱わず、追加依存は発生させない。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 新規: `.github/copilot/plans/27-implementation-plan.md`（本書）
  - 修正: `/src/components/task-list/task-list-header.tsx`（日本語ラベルを内部定義として統合）
  - 修正: `/example/src/App.tsx`（`JapaneseTaskListHeader` 定義と `TaskListHeader` props 指定を削除）
  - 影響確認: `/src/components/Gantt.tsx`（props 構造は変更しないことを確認）
- 影響範囲・互換性リスク:
  - デフォルトヘッダーが日本語固定となる。既存ユーザーが独自ヘッダーを渡している場合は従来通り上書きされるため互換性は維持。
  - DOM 構造は同等、列解決ロジックは既存 `resolveVisibleFields` を継続利用し、表示幅のみ従来仕様を踏襲。
- 外部依存・Secrets の扱い:
  - 追加依存なし。Secrets 利用なし。

# 3. 設計方針
- 責務分離 / データフロー:
  - `TaskListHeaderDefault` 内で `labels: Record<VisibleField, string>` を日本語固定で宣言し、既存の `resolveVisibleFields` と CSS クラスをそのまま利用する。
  - `Gantt` は props による上書きを許容するため、デフォルトコンポーネントを日本語化するのみで構造変更は行わない。
- エッジケース / 例外系 / リトライ方針:
  - `visibleFields` が部分指定の場合も `resolveVisibleFields` の既定順序に沿って日本語ラベルを適用する。
  - 未知のフィールドは受け付けない現行型定義を維持するため追加対応不要。
- ログと観測性:
  - 追加ログなし。UI 文言のみの変更。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常: `TaskListHeader` デフォルトで日本語ラベルが描画されること。
  - 回帰: `TaskListHeader` props 経由でカスタムヘッダー指定時に上書きされること（既存挙動維持）。
- モック / フィクスチャ方針:
  - UI 文言確認にとどまるため追加モック不要。既存 Story/例示での目視確認を想定。
- テスト追加の実行コマンド:
  - 既存に合わせ `npm test`（必要に応じて）を想定。UI 文字列のみのため必要に応じスキップ可。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm run lint`
  - `npm run build` または `npm run typecheck` がある場合は実行
  - `npm test`
  - セキュリティスキャン（設定がある場合に従う）
- 通過基準と失敗時の対応:
  - いずれも 0 エラーで完了すること。失敗時は該当箇所のみを最小修正。

# 6. ロールアウト・運用
- ロールバック方法:
  - `task-list-header.tsx` の日本語ラベル変更を元に戻し、example 側でヘッダーを再定義・指定する従来構成へ戻す。
- 監視・運用上の注意:
  - 文字化けやロケール依存のフォント崩れがないかを UI で確認。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - 多言語化の将来方針（本 Issue では対応しない）。
- ADR に残すべき判断:
  - なし（日本語固定を暫定標準とする軽微な UI 仕様変更のため）。
