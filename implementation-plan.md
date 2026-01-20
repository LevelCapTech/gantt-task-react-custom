# 1. ゴール / 非ゴール
- ゴール: Task データモデルを `process` / `assignee` / `plannedStart` / `plannedEnd` / `plannedEffort` / `actualEffort` / `status` の7項目で拡張し、一覧・ガントバー・ツールチップで表示/編集できるようにする。選択肢は定数 (`TASK_PROCESS_OPTIONS`, `TASK_STATUS_OPTIONS`) に固定し、JSON エクスポートにも新フィールドを含める。
- 非ゴール: 新規ライブラリ導入や大規模なレイアウト刷新、外部 API 連携、i18n 対応の追加。

# 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - 型定義: `src/types/public-types.ts`, `src/types/bar-task.ts`
  - 定数: `src/constants/taskOptions.ts`（新規）
  - コンポーネント: `src/components/gantt/gantt.tsx`, `src/components/gantt/task-gantt-content.tsx`, `src/components/task-list/task-list.tsx`, `src/components/task-list/task-list-header.tsx`, `src/components/task-list/task-list-table.tsx`, `src/components/task-item/task-item.tsx`, `src/components/other/tooltip.tsx`
  - スタイル: `src/components/task-list/*.css`, `src/components/other/tooltip.module.css`, `src/components/task-item/task-list.module.css` など必要箇所
  - サンプルデータ/表示: `example/src/helper.tsx`, `example/src/App.tsx`
  - テスト: `src/test/*.test.tsx`（新規追加を含む）
- 影響範囲・互換性リスク: Task 型が拡張されるが新フィールドはオプショナルとし既存タスクは空表示で後方互換を維持。列追加によりタスクリスト幅が増えるためスクロールと列幅調整を行う。
- 外部依存・Secrets の扱い: 依存追加なし。Secrets/PII は扱わない。

# 3. 設計方針
- 責務分離 / データフロー: `Task` に新フィールドと選択肢型を追加し、Gantt → TaskGanttContent → TaskItem/Tooltip/TaskList へ透過的に渡す。`process`/`status` は定数のユニオン型で制限し、表示・更新時は定数を唯一の参照元とする。
- UI/表示: タスクリストに工程・担当者・予定開始/終了・予定工数・実績工数・進捗ステータス列を追加し、ステータスは色付きバッジで表示。日付表示は `YYYY-MM-DD` 固定。未設定の工数・日付は空欄表示。
- オプション・フォールバック: `visibleFields` のような表示制御設定を追加しデフォルトは全表示。無効な `process`/`status` は定義済み先頭値へフォールバック。`plannedEffort`/`actualEffort` は 0 以上の数値のみを表示対象とし、それ以外は空。
- テーマ/スタイル: ステータス色を CSS 変数/クラスで指定（例: 未着手=gray, 進行中=blue, 完了=green, 保留=orange）。列幅はデフォルト値を設け、横スクロールで全列確認できるようにする。
- JSON エクスポート: Task 配列を JSON 化した際に新フィールドが欠落しないよう型とフィクスチャを更新する。

# 4. テスト戦略
- テスト観点: Task 型拡張の型整合性、タスクリスト/ツールチップ/バーでの新フィールド表示、ステータスバッジ色、`process`/`status` ドロップダウン更新、JSON エクスポートで新フィールドが含まれること、未設定時の空欄フォールバック。
- モック / フィクスチャ: 新フィールドを含む Task フィクスチャを追加し、未設定/無効値/計画のみ等のケースを網羅。外部 API なし。
- テスト追加の実行コマンド: `npm run test:unit` を中心に、最終確認で `npm run test`。

# 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）: `npm run test`（lint・build・unit を包含）。依存追加がないため追加のセキュリティスキャンは不要。
- 通過基準と失敗時の対応: すべて成功すること。型/表示差分で失敗した場合は Task 変換と表示ロジックの整合を優先修正する。

# 6. ロールアウト・運用
- ロールバック方法: 変更ファイルを元の状態へ戻すか Git で revert。デモ用途のため段階的リリースは不要。
- 監視・運用上の注意: タスクリスト横幅とステータス色が想定通りか目視確認する。

# 7. オープンな課題 / ADR 要否
- 未確定事項: 工数単位切替の拡張や追加ステータス色の詳細は将来の課題。現行 Issue ではデフォルト値の実装にとどめる。
- ADR に残すべき判断: Task フィールドの optional 取り扱いとステータス色のデフォルト決定は必要に応じて ADR 化。
