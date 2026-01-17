# 1. ゴール / 非ゴール
- ゴール: Task データモデルに 7 項目（`process`/`assignee`/`plannedStart`/`plannedEnd`/`plannedEffort`/`actualEffort`/`status`）を追加する設計を確定し、型定義・サンプルデータ・UI/状態管理の反映方針を明文化する。
- 非ゴール: コード実装や API/DB 連携、i18n 対応、外部ユーザー情報との同期。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 型: `src/types/public-types.ts`（Task 型拡張と選択肢定義追加）
  - コンポーネント: `src/components/gantt/task-gantt-content.tsx`, `src/components/gantt/gantt.tsx`, `src/components/task-item/task-item.tsx`, `src/components/task-list/task-list.tsx`, `src/components/other/tooltip.tsx`（新フィールドの受け渡し/表示）
  - サンプル: `example/src/helper.tsx` などタスク生成箇所
  - その他: 必要に応じて選択肢定数の切り出しファイルを新設
- 影響範囲・互換性リスク: 既存利用者の Task 型互換性を守るため新規フィールドはオプショナルとし、欠損時はデフォルト（`process: "その他"`, `status: "未着手"` など）で処理する方針。JSON エクスポートやバーツールチップへの情報伝播を追加するが既存基本動作は維持。
- 外部依存・Secrets の扱い: 新規依存は追加しない。Secrets/PII は保持しない。

# 3. 設計方針
- 責務分離 / データフロー: `Task` に `process`/`status` のユニオン型（選択肢定数と併用）と予定/実績系フィールドを追加し、`Gantt` → `TaskGanttContent` → `TaskItem`/`TaskList`/`Tooltip` まで同型で透過的に渡す。リスト側で `process`/`status` を選択式入力（`status` は色付きバッジで表示、色定数は実装時に固定）、`assignee` を表示、`plannedStart`/`plannedEnd` を日付表示、`plannedEffort`/`actualEffort` はツールチップ/詳細表示に載せる。
- エッジケース / 例外系 / リトライ方針: 不正な `process`/`status` は定数一覧に含まれるか検証し、未定義・不正時はデフォルト値へフォールバック。`planned*`/`*Effort` 未設定は空表示、数値は 0 以上のみ許容とし負数は未設定（undefined）として扱う。既存タスクに新規フィールドがなくてもクラッシュしないよう正常系優先で扱う。
- ログと観測性（漏洩防止を含む）: 追加フィールドはログ出力不要。例外時は文脈を保持した警告ロギングのみ行い、個人名（assignee）を不用意に出力しない。

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
- 未確定事項: `process`/`status` のデフォルト値・バッジ色の具体値、工数の単位（h 固定以外の拡張要否）。日付表示位置（リスト/ツールチップの両方に表示かどちらか優先か）を実装時に最終決定する。
- ADR に残すべき判断: デフォルト値とバリデーション方針、`Task` フィールドの optional/required 取り扱いを決定した際は ADR で記録。
