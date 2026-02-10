# 1. 機能要件 / 非機能要件
- 機能要件:
  - UI 表示は `MM/dd(曜日)` に統一し、日本語略称 `(日)(月)(火)(水)(木)(金)(土)` を使用する（Issue 記載の `MM/DD(曜日)` と同義。例: `Intl.DateTimeFormat(locale ?? "ja", { month: "2-digit", day: "2-digit", weekday: "short" })` と `formatToParts` を用いて `month`/`day`/`weekday` の part を抽出し、`MM/dd(曜日)` の並びに組み立てる）。
  - 日本の祝日定義をライブラリ内に同梱し、`enableJPHoliday` で有効化できる（デフォルト `true`）。
  - 土日祝を非稼働日として扱い、`workOnSaturday` で土曜稼働を切り替える（デフォルト `false`）。
  - `extraHolidays` / `extraWorkingDays` の ISO 日付文字列（`YYYY-MM-DD`）で独自休業日・特別稼働日を上書きでき、同日指定時は `extraWorkingDays` を優先する。
  - 工数計算・進捗率・日付ヘッダー・背景描画・ツールチップが統一的なカレンダー設定を参照する。
  - `GanttConfig`（公開設定）にカレンダー設定を追加し、未指定時は日本標準設定にフォールバックする。
  - 無効な日付文字列は例外にせず無視する。
  - 祝日データはライブラリ内の静的データとして同梱し、年度更新はリリースで反映する（不足分は `extraHolidays` / `extraWorkingDays` で補完）。
- 非機能要件:
  - 祝日データは静的同梱で、外部 API には依存しない。
  - 既存の公開 API（特に `DisplayOption.locale` 指定）は尊重する。デフォルト挙動を日本仕様へ変更する場合はメジャーバージョンアップと移行策を明記する。
  - 将来的な祝日 API や JSON Schema 化に備えた拡張可能な構造を維持する。
  - i18n 対応は行わず日本語固定とする。

# 2. スコープと変更対象
- 変更ファイル（設計成果物）: `.github/copilot/plans/102-implementation-plan.md`（新規、設計のみ）。実装時の想定変更対象は次項に列挙する。
- 実装時に想定される変更対象:
  - `src/types/public-types.ts`（設定型の拡張）
  - `src/components/gantt/gantt.tsx`（props 受け渡し）
  - `src/components/calendar/calendar.tsx` / `top-part-of-calendar.tsx`（ヘッダー表示）
  - `src/helpers/date-helper.ts` / `src/types/date-setup.ts`（日付計算）
  - `src/components/grid`（非稼働日背景）
  - `src/test/date-helper.test.tsx`（稼働日判定テスト）
- 影響範囲・互換性リスク: 設計文書のみ。実装時はカレンダー表示・工数計算・進捗率・背景描画へ影響。
- 外部依存・Secrets の扱い: 追加なし（既存の `Intl.DateTimeFormat` を利用する前提で、Secrets は不要）。

# 3. 設計方針
- 責務分離 / データフロー:
  - `GanttConfig` → `CalendarConfig` 正規化 → `CalendarState`（祝日・例外日・稼働日判定） → 工数計算 / 進捗 / 描画 / ツールチップへ共有。
  - 稼働日判定を単一ユーティリティに集約し、計算系と UI が同じ結果を参照する。
  - シーケンス図:
    ```mermaid
    sequenceDiagram
      participant User as 利用者
      participant GanttConfig as GanttConfig
      participant CalendarConfig as CalendarConfig
      participant CalendarState as CalendarState
      participant Renderer as 描画/計算
      User->>GanttConfig: 設定入力
      GanttConfig->>CalendarConfig: 正規化
      CalendarConfig->>CalendarState: 稼働日判定
      CalendarState->>Renderer: 表示・計算へ反映
      Renderer-->>User: 画面描画
    ```
- カレンダー設定仕様（仕様書）:
  - `locale`: `"ja"`（デフォルト。`DisplayOption.locale` が指定されている場合はそれを優先する）。
  - `dateFormat`: `"MM/dd(EEE)"`（`ja` ロケールで「1. 機能要件 / 非機能要件」の `MM/dd(曜日)` を表現する固定パターン名。Issue の既定値に合わせた legacy 識別子として扱い、互換性維持のためこの文字列を保持する（将来 `JP_STANDARD` などへの変更を検討）。この値は date-fns の書式文字列として解釈せず、`Intl.DateTimeFormat` + `formatToParts` の出力組み立てに紐づく識別子として扱う）。
  - `enableJPHoliday`: `true`。
  - `highlightNonWorkingDays`: `true`。
  - `workOnSaturday`: `false`。
  - `extraHolidays`: `string[]`（ISO 日付、デフォルト `[]`）。
  - `extraWorkingDays`: `string[]`（ISO 日付、デフォルト `[]`）。
- `GanttConfig` 構造の拡張仕様書:
  - 公開 API の設定型（`GanttConfig` または `GanttProps`）に `calendar?: CalendarConfig` を追加し、上記キーを包含する。
  - `calendar` 未指定の場合は日本標準設定を自動適用する（デフォルト変更を行う場合はメジャーバージョンアップと移行策を明記する）。
  - ロケールの優先順位は `calendar.locale` > 既存の `DisplayOption.locale` > ライブラリ既定値（従来どおり）とする。
  - i18n 非対応とは「祝日定義や固定文言が日本語である」ことを意味する。
  - `calendar.locale` / `DisplayOption.locale` に `"ja"` 以外が指定されても無効化せず、日付表示にのみ利用する（祝日や文言は日本語のまま）。
  - 非 `ja` 指定時は注意喚起の警告ログを出し、公開 API ドキュメントで混在ロケールの制約を明記する。
- 祝日データ運用:
  - ライブラリ内に静的な祝日データ（TS/JSON）を同梱し、年度更新はパッケージリリースで反映する。
  - 利用者が独自の祝日データを外部 JSON で管理する場合は、読み込んだ日付を `extraHolidays` / `extraWorkingDays` に渡して補完する（ライブラリ側でのファイル I/O は行わない）。
- 稼働日判定ルール:
  - 基本非稼働日 = 日曜 + `workOnSaturday` が `false` の場合の土曜 + `enableJPHoliday` が `true` の日本祝日。
  - `extraHolidays` は通常稼働日となる日を非稼働に上書きする。
  - `extraWorkingDays` は最優先で稼働日に上書きする（週末・祝日・`extraHolidays` より優先）。
  - ISO 日付文字列は日付単位で正規化し、重複や無効値は除外する。
- UI 描画ルール:
  - 日付ヘッダーは `MM/dd(曜日)` 表記で固定し、曜日は日本語略称（`Intl.DateTimeFormat` + `formatToParts` で `month/day/weekday` を抽出して組み立てる）。
  - `highlightNonWorkingDays` が `true` の場合、非稼働日背景をグレー表示。
  - `extraWorkingDays` に該当する日付は通常背景を維持。
  - ツールチップには稼働日/非稼働日の区別を併記し、表示内容は日本語固定。
- エッジケース / 例外系 / リトライ方針:
  - 無効な日付文字列は無視し、例外を投げない（開発向けに警告ログを出す）。
  - `dateFormat` は `"MM/dd(EEE)"` のみ許可する Union 型で公開し、実行時に他の値が渡された場合は警告を出して既定パターンへフォールバックする（カスタムパターンは将来拡張の検討対象）。
  - 同一日付が `extraHolidays` と `extraWorkingDays` の両方に含まれる場合は稼働日を優先する。
  - 年跨ぎの祝日リストは年単位で拡張できる構造とする。
- ログと観測性（漏洩防止を含む）:
  - デバッグ用に日付正規化の警告を出す場合は日付文字列のみを扱い、PII を含めない。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 稼働日判定（平日/土日/祝日/特別休業日/特別稼働日）の正常系・例外系。
  - `workOnSaturday` の切り替えと `extraWorkingDays` の優先順位。
  - 無効な日付文字列が無視されること。
  - 日付ヘッダー表示が `MM/dd(曜日)` に統一されること。
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
