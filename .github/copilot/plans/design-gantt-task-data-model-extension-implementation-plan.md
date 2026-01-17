# 1. ゴール / 非ゴール
- ゴール: Task データモデルに 7 項目（`process`/`assignee`/`plannedStart`/`plannedEnd`/`plannedEffort`/`actualEffort`/`status`）を追加する設計を確定し、型定義・サンプルデータ・UI/状態管理の反映方針を明文化する。
- 非ゴール: コード実装や API/DB 連携、i18n 対応、外部ユーザー情報との同期。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 型定義: `src/types/public-types.ts`（Task 型拡張と選択肢定義追加）
  - コンポーネント: `src/components/gantt/task-gantt-content.tsx`, `src/components/gantt/gantt.tsx`, `src/components/task-item/task-item.tsx`, `src/components/task-list/task-list.tsx`, `src/components/other/tooltip.tsx`（新フィールドの受け渡し/表示）
  - サンプル: `example/src/helper.tsx` などタスク生成箇所
  - その他: 必要に応じて選択肢定数の切り出しファイルを新設
- 影響範囲・互換性リスク: 既存利用者の Task 型互換性を守るため新規フィールドはオプショナルとし、欠損時はデフォルト（`process: "その他"`, `status: "未着手"` を原則とする）で処理する方針。JSON エクスポートやバーのツールチップへの情報伝播を追加するが既存基本動作は維持。
- 実装時の具体的な修正箇所と影響範囲:
  - データ型: `Task` 拡張と選択肢定数の追加に伴う型エクスポート影響（型利用箇所全般）。
  - データ変換/状態: `gantt.tsx` 内での props 正規化、`task-gantt-content.tsx` の内部変換ロジック（bar/collapse 計算）への新フィールド透過。
  - 表示/UI: `TaskList`（process/status/assignee/予定日表示、バッジ/ドロップダウン追加）、`TaskItem`（バー末尾表示やクラス付与）、`Tooltip`（予定/実績工数と予定日表示）の表示追加。
  - サンプル/デモ: `example/src/helper.tsx` のタスク初期値更新と、必要なら選択肢 UI 例示の追加。
  - テスト: 既存ユニットテストのフィクスチャ拡張と、新フィールドの表示/フォールバック/JSON エクスポート検証テストの追加。
- 外部依存・Secrets の扱い: 新規依存は追加しない。Secrets/PII は保持しない。

# 3. 設計方針
- 責務分離 / データフロー: `Task` に `process`/`status` のユニオン型（選択肢定数と併用）と予定/実績系フィールドを追加し、`Gantt` → `TaskGanttContent` → `TaskItem`/`TaskList`/`Tooltip` まで同型で透過的に渡す。  
  リスト側で `process`/`status` を選択式入力（`status` は色付きバッジで表示、色定数は実装時に固定）、`assignee` を表示し、`plannedStart`/`plannedEnd` は日付として、`plannedEffort`/`actualEffort` はツールチップ/詳細表示に載せる。
- エッジケース / 例外系 / リトライ方針:
  - 不正な `process`/`status` は選択肢定数に厳密一致しない値（`undefined`/`null`/空文字/大小文字・全半角揺れ/異なる文字列）として扱い、デフォルト値へフォールバック（ケースセンシティブで `process` は {設計, 開発, テスト, レビュー, リリース, その他}、`status` は {未着手, 進行中, 完了, 保留} に限定し、`public-types.ts` の定数/enum（例: `TASK_PROCESS_OPTIONS`/`TASK_STATUS_OPTIONS`）を唯一の参照元にする）。
  - `planned*`/`*Effort` 未設定は空表示とし、工数は h 単位・0 以上の number のみ許容する。
  - 負数の工数は未設定（undefined）として扱い、計算に含めない。
  - 既存タスクに新規フィールドがなくてもクラッシュしないよう正常系優先で扱う。
- ログと観測性（漏洩防止を含む）: 追加フィールドはログ出力不要。例外時は文脈を保持した警告ロギングのみ行い、個人名（assignee）は出力しない（必要に応じてタスク ID など匿名化情報に置換）。タスク名・工程名に機微な業務情報が含まれる可能性もあるため、ログには ID/enum 値のみを記録する。ログレベルは WARN を基本とし、デバッグ時もマスクした上で INFO にとどめる。

# 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）: Task 型が新フィールドを許容する型チェック、`process`/`status` のフォールバック動作、予定日・工数表示のフォーマット、JSON エクスポートに新項目が含まれることをユニットテストで確認。既存のガント描画テストに追加ケースを差し込む。
- モック / フィクスチャ方針: 追加タスクフィクスチャを用意し、`planned*` 未設定・無効値・最大/最小日付を含むケースを作る。外部 API は未使用のためモック不要。
- テスト追加の実行コマンド: `npm test`（既存の unit/lint/build を包含）。必要に応じて対象テストだけ `npm run test:unit -- Task` で局所実行。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）: 既存 `npm test` を継続利用し lint/typecheck/build/unit を網羅。セキュリティスキャンは追加しないが依存追加が無い前提で npm audit 結果は監視。
- 通過基準と失敗時の対応: すべてのチェックが成功すること。型拡張で lint/typecheck が失敗した場合はタスク変換ロジックや UI コンポーネントの型整合を優先修正。

# 6. ロールアウト・運用
- ロールバック方法: 変更ファイルを元の Task 型/サンプルに戻すか Git で revert。デモ用途のためリリース工程は不要。
- 監視・運用上の注意: デモ UI で新フィールド表示崩れがないか目視確認する。フォールバックが意図通り動くか最初の動作確認でチェック。

# 7. オープンな課題 / ADR 要否
- 未確定事項: バッジ色の具体値、工数の単位拡張要否（現時点では h 固定）。日付表示位置（リスト/ツールチップの両方に表示かどちらか優先か）を実装時に最終決定する。決定責任: プロダクトオーナー/設計担当。期限: 2026-01-24 の設計レビューまで（IMPLEMENT Issue 起票前）に確定。
- ADR に残すべき判断: デフォルト値とバリデーション方針、`Task` フィールドの optional/required 取り扱いを決定した際は ADR で記録。
