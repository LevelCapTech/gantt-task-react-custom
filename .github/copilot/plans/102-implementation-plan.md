# 1. 機能要件 / 非機能要件
- 機能要件:
  - UI 表示は要求通り `MM/DD(曜日)` に統一し、日本語略称 `(日)(月)(火)(水)(木)(金)(土)` を使用する（表記の `DD` は日付表示の意味であり、date-fns のトークンではない。内部実装では date-fns の `MM/dd(EEE)` を使用し `dd` は日付を表す）。
  - 日本の祝日定義をライブラリ内に同梱し、`enableJPHoliday` で有効化できる（デフォルト `true`）。
  - 土日祝を非稼働日として扱い、`workOnSaturday` で土曜稼働を切り替える（デフォルト `false`）。
  - `extraHolidays` / `extraWorkingDays` の ISO 日付文字列（`YYYY-MM-DD`）で独自休業日・特別稼働日を上書きでき、同日指定時は `extraWorkingDays` を優先する。
  - 工数計算・進捗率・日付ヘッダー・背景描画・ツールチップが統一的なカレンダー設定を参照する。
  - `GanttConfig`（公開設定）にカレンダー設定を追加し、未指定時は日本標準設定にフォールバックする。
  - 無効な日付文字列は例外にせず無視する。
- 非機能要件:
  - 祝日データは静的同梱で、外部 API には依存しない。
  - 既存の公開 API との互換性を維持し、設定未指定でも従来の操作感を壊さない。
  - 将来的な祝日 API や JSON Schema 化に備えた拡張可能な構造を維持する。
  - i18n 対応は行わず日本語固定とする。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）: `.github/copilot/plans/102-implementation-plan.md`（新規、設計のみ）。
- 影響範囲・互換性リスク: 設計文書のみ。実装時はカレンダー表示・工数計算・進捗率・背景描画へ影響。
- 外部依存・Secrets の扱い: 追加なし（既存の `date-fns` を利用する前提で、Secrets は不要）。

# 3. 設計方針
- 責務分離 / データフロー:
  - `GanttConfig` → `CalendarConfig` 正規化 → `CalendarState`（祝日・例外日・稼働日判定） → 工数計算 / 進捗 / 描画 / ツールチップへ共有。
  - 稼働日判定を単一ユーティリティに集約し、計算系と UI が同じ結果を参照する。
- カレンダー設定仕様（仕様書）:
  - `locale`: `"ja"`（デフォルト）。
  - `dateFormat`: `"MM/dd(EEE)"`（UI 表示は要件上 `MM/DD(曜日)` と表記するが、date-fns の日付トークンは小文字 `dd` を使用）。
  - `enableJPHoliday`: `true`。
  - `highlightNonWorkingDays`: `true`。
  - `workOnSaturday`: `false`。
  - `extraHolidays`: `string[]`（ISO 日付、デフォルト `[]`）。
  - `extraWorkingDays`: `string[]`（ISO 日付、デフォルト `[]`）。
- `GanttConfig` 構造の拡張仕様書:
  - 公開 API の設定型（`GanttConfig` または `GanttProps`）に `calendar?: CalendarConfig` を追加し、上記キーを包含する。
  - `calendar` 未指定の場合は日本標準設定を自動適用する。
  - `calendar.locale` を優先し、未指定時は既存の `DisplayOption.locale` をフォールバックとして扱う。どちらも未指定の場合は `"ja"` を適用する。
  - i18n 非対応のため、`calendar.locale` / `DisplayOption.locale` に `"ja"` 以外が指定された場合は `"ja"` にフォールバックする。
- 稼働日判定ルール:
  - 基本非稼働日 = 日曜 + `workOnSaturday` が `false` の場合の土曜 + `enableJPHoliday` が `true` の日本祝日。
  - `extraHolidays` は基準日を非稼働に上書きする。
  - `extraWorkingDays` は最優先で稼働日に上書きする（週末・祝日・`extraHolidays` より優先）。
  - ISO 日付文字列は日付単位で正規化し、重複や無効値は除外する。
- UI 描画ルール:
  - 日付ヘッダーは `MM/DD(曜日)` 表記で固定し、曜日は日本語略称。
  - `highlightNonWorkingDays` が `true` の場合、非稼働日背景をグレー表示。
  - `extraWorkingDays` に該当する日付は通常背景を維持。
  - ツールチップには稼働日/非稼働日の区別を併記し、表示内容は日本語固定。
- エッジケース / 例外系 / リトライ方針:
  - 無効な日付文字列は無視し、例外を投げない。
  - 同一日付が `extraHolidays` と `extraWorkingDays` の両方に含まれる場合は稼働日を優先する。
  - 年跨ぎの祝日リストは年単位で拡張できる構造とする。
- ログと観測性（漏洩防止を含む）:
  - デバッグ用に日付正規化の警告を出す場合は日付文字列のみを扱い、PII を含めない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 稼働日判定（平日/土日/祝日/特別休業日/特別稼働日）の正常系・例外系。
  - `workOnSaturday` の切り替えと `extraWorkingDays` の優先順位。
  - 無効な日付文字列が無視されること。
  - 日付ヘッダー表示が `MM/DD(曜日)` に統一されること。
- モック / フィクスチャ方針:
  - 日付は固定値でテストし、祝日データは同梱の静的データを使用する。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm test`（既存の lint/build/unit を包含）。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm test`（lint/build/unit を実行）。
- 通過基準と失敗時の対応:
  - すべて成功すること。失敗時はカレンダー設定の影響範囲を見直す。

# 6. ロールアウト・運用
- ロールバック方法: 設計文書のため、該当ファイルを差し戻す。
- 監視・運用上の注意: 実装時はカレンダー設定変更が即時反映されることを確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項:
  - 祝日データの更新頻度と年度追加の運用ルール。
  - 既存 `DisplayOption.locale` が指定されている場合の互換性検証（フォールバックが意図通りに機能するか）。
- ADR に残すべき判断:
  - `GanttConfig` に `calendar` を新設するか、既存オプションへ分散させるかの判断。
