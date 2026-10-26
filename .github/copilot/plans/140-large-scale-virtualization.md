# 大規模タスク (10k〜50k件) 向け描画仮想化と依存関係解決の高速化 plan

## 1. 機能要件 / 非機能要件

- 機能要件:
  - 1k / 10k / 50k 件のタスクデータで、初期描画・スクロール・タスク編集・依存関係解決の性能を定量計測するベンチマーク基盤を整備する。
  - 行の仮想化を導入し、表示領域内とバッファ領域のタスク行のみを描画し、画面外のタスク行をアンマウントまたは非表示にする。
  - 依存関係の解決は現行実装の `Map` / `Set` ベース索引を前提とし、追加で必要な最適化は仮想化時の表示範囲フィルタと再計算抑制に限定する。
  - 依存線の描画を表示領域に対してフィルタし、画面外の依存線を間引く。表示領域に入る依存のみに描画する。
  - タスク更新時の再レンダリングを抑制し、影響がない行・セル・依存線を再利用または描画対象から除外する。
  - 既存の `rowHeight` 固定レイアウトと公開 API を維持しつつ、仮想化は `ganttHeight` 指定時または明示的なオプトイン Prop で有効化する。
  - 依存モデルの整合性を `normalizeTaskDependencies` と `dependencyLinks` / `dependencies` の共通化に沿って維持し、Issue #139 の依存関係拡張との整合を確認する。
  - 画面外タスクがアンマウントされても、編集中行・選択中行・フォーカス中セル・ドラッグ中状態が破損しないように戦略を持つ。
- 非機能要件:
  - 10k / 50k 件でも表示領域内の行を中心に描画し、DOM/SVG 要素数が無制限に増えない構造を維持する。
  - 依存解決コストは `Map` / `Set` ベースの索引参照を利用し、仮想化時に可視範囲の計算コストを削減する。不要な反復検索を避け、描画対象に絞った実行を優先する。
  - スクロール、ドラッグ、セル編集、依存線描画が仮想化後も利用可能なことを受け入条件とする。
  - 既存の API と表示互換性を保ち、破壊的変更を行わない。
  - 依存追加やライブラリ導入は最小限とし、`peerDependencies` / `dependencies` の対象と理由を明確にする。

## 2. スコープと変更対象

- 変更ファイル（新規/修正/削除）:
  - 主要実装対象（実装フェーズで変更予定）:
    - `src/components/gantt/gantt.tsx` — スクロール同期、表示範囲計算、仮想化のハブ、`ganttHeight` 条件分岐
    - `src/components/gantt/task-gantt-content.tsx` — 表示範囲での `TaskItem` / `Arrow` 描画、依存線の可視性フィルタ
    - `src/components/task-list/task-list.tsx` / `task-list-table.tsx` — 左ペインの仮想化とスクロール同期
    - `src/components/grid/grid-body.tsx` — 行背景・区切り・非稼働日描画の表示範囲制限
    - `src/helpers/bar-helper.ts` — `convertToBarTasks` の依存マップ生成、`Map` ベースの依存解決と最適化
    - `src/helpers/other-helper.ts` — `removeHiddenTasks` / `getChildren` を仮想化対応へ再構成し、折りたたみ描画に対する表示範囲を考慮
    - `src/types/public-types.ts` — 仮想化用のオプション Prop を追加または拡張（オプションのみ）
    - `src/test/**/*.test.tsx` — 仮想化・依存解決・スクロール同期の回帰テスト
    - ベンチマーク導入箇所: `src/test/benchmark/` または `src/test/perf/` 配置のテスト/ユーティリティ
  - 設計成果物:
    - `.github/copilot/plans/140-large-scale-virtualization.md`（本ファイル）
- 影響範囲・互換性リスク:
  - 既存の公開 Props は維持し、仮想化は新規オプション `virtualization` / `overscan` / `enableVirtualization` などのオプショナル Prop で制御し、未指定時は現行挙動を維持する。
  - `ganttHeight` 未指定（0）の場合は現行の全行表示を維持し、仮想化は `ganttHeight > 0` または明示的な opt-in で有効化する。これにより既存の表示とスクロール動作を保つ。
  - 行高さは現状の固定 `rowHeight` を前提とする。可変高さ対応は本 issue の対象外とし、将来的に拡張時に ADR を検討する。
  - 依存描画は「表示領域内に少なくとも片方のタスクがある依存のみ描画」を基本方針とする。画面外の依存を描画しないが、依存関係のロジック自体は保持する。
  - 画面外行のアンマウント時に編集中コンポーネントや `getBBox()` ベースの幅計測が壊れないよう、アクティブ編集中/選択中のタスクは表示範囲のバッファ内または明示的な keep-alive ルールを設ける。
  - 公開 API に破壊的変更を伴う場合は、移行策を明記し、必要に応じて ADR を作成する。ただし本 design では API 変更を最小化する。
- 外部依存・Secrets の扱い:
  - 依存ライブラリ追加は最小限とし、既存の `react`, `react-dom`, `@dnd-kit/*` を維持する。自前実装で完結できる範囲を優先し、外部仮想化ライブラリを導入する場合は `peerDependencies` / `dependencies` の区別とバンドルサイズ影響を記録する。
  - ベンチマーク実行時に Secrets / PII / 個人情報を含むデータを使わない。テストデータは固定のダミー ID と生成ロジックで作成し、ログにも実データを出力しない。

## 3. 設計方針

- 責務分離 / データフロー（必要なら Mermaid 1 枚）:

  ```mermaid
  flowchart LR
    A[Task input] --> B[normalizeActuals / sort / removeHiddenTasks]
    B --> C[convertToBarTasks]
    C --> D[Dependency Index Map]
    D --> E[Visible row range]
    E --> F[Task list / Grid / Timeline rendering]
    C --> G[Dependency edge filtering]
    G --> H[Arrow rendering]
    F --> I[Scroll sync / partial rerender]
    I --> J[User interactions]
  ```

  - 役割分担:
    - `normalizeTaskDependencies` で依存の正規化と重複排除を通し、共通の依存モデルを `src/helpers/bar-helper.ts` に保持する。
    - `convertToBarTasks` はタスク変換と `barChildren` / `barDependencyChildren` の組み立てを行い、レンダリング側は表示範囲の `tasks` を受け取るだけにする。
    - `gantt.tsx` は縦スクロール値と表示範囲を決定し、行一覧・グリッド・タイムラインの表示範囲をずらし、見えているタスク集合の計算を一元化する。
    - `TaskGanttContent` は表示範囲に絞った `tasks` のみを描画し、依存線も同じ visible set に基づいて描画する。
    - `GridBody` は行背景と区切りを `visibleStartIndex` / `visibleEndIndex` で描画し、水平方向の大きな SVG も必要な範囲だけを描画対象にする。
- エッジケース / 例外系 / リトライ方針:
  - 表示領域が縦方向に 0 になる場合: `visibleStartIndex` / `visibleEndIndex` を clamp し、空の描画を返す。
  - 表示領域外の依存線: 依存元と依存先のいずれかが視界に入っていない場合は描画しない。両方とも非表示なら、依存線は `null` とする。
  - 依存関係の重複: `dependencyKey` と `Set` で重複削除し、`dependencyLinks` と `dependencies` が同時に存在する場合も同一解釈に統一する。
  - 折りたたみ状態: `removeHiddenTasks` を先に適用し、仮想化の visible set が折りたたみ後の展開タスクと整合するように計算する。`getChildren` の再帰的探索は `filter` / `indexOf` を増やさず、事前に `Map` 化して再利用する。
  - `scrollY` と `TaskList` / `TaskGantt` の同期: 1 つのスクロール源を保持し、左右のスクロール同期と同様に単一の状態更新でパイプラインを簡潔に保つ。
  - 画面外アンマウントによる編集中セル破損: `isSelected` / `isEditing` / `dragging` の状態を持つタスクだけは `keep-alive` 相当の扱いを行い、viewport から外れても同一コンポーネントのライフサイクルを維持する。
  - 依存検索の消失: `task.id` 一意性が崩れるケースは除外し、既存の `Task` 型と `BarTask` の ID を用いた index を前提に設計する。
  - 自前実装とライブラリ導入の比較: 初期実装は固定 `rowHeight` を前提に自前実装で進め、虚弱なケースのみ外部仮想化ライブラリ導入を検討する。導入に際しては bundle / peerDependencies / React 18 並行対応を明記する。
- ログと観測性（漏洩防止を含む）:
  - ベンチマークの結果は `console.table` やテスト出力に統一し、個人情報や実データは含めない。
  - 依存関係や visible set の計算は診断用に `debug` フラグを持つが、公開 API では出さず、必要時のみ dev build で有効にする。
  - 実装中に `console.error` を使う場合は、エラー内容を要約したメッセージに留め、タスク ID や依存 ID の詳細が必要な場合はダミー化する。
  - ベンチマーク結果は `docs/perf/` もしくは `src/test/perf/` の定義に合わせて記録し、課題と改善前後の比較を残す。

## 4. テスト戦略

- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 依存関係解決:
    - `normalizeTaskDependencies` と `convertToBarTasks` で、`dependencies` / `dependencyLinks` の両方が同一結果になることを確認する。
    - 重複依存が排除されること、存在しない依存 ID が無視されること、無効な型が `FS` デフォルトへ正規化されることを確認する。
  - 仮想化:
    - 表示領域外の行は render されないこと。
    - 表示対象とバッファ分の行だけが描画され、タスク数を増やしても描画要素数が一定範囲に収まること。
    - スクロール位置に応じて描画される行が変わり、先頭・末尾の境界を含む切り替えが正しいこと。
    - `ganttHeight` 未指定時の既存全行描画が変わらず、仮想化が opt-in であること。
  - スクロール同期:
    - 左ペインの縦スクロールとタイムラインの縦スクロールが同期すること。
    - `scrollY` 変化で `visibleStartIndex` / `visibleEndIndex` が正しく更新されること。
  - 依存線描画:
    - 表示領域外のタスクを参照する依存線が描画されないこと。
    - 依存元または依存先の一方だけが可視なら、表示対象に合わせて依存線の描画状態が決定されること。
    - `task.barDependencyChildren` と `Arrow` の描画が、画面外依存を省略した場合でも整合すること。
  - 主要イベント:
    - 展開・折りたたみ、並べ替え、選択、セル編集、バーのドラッグが仮想化後も動作すること。
    - 1 件のタスク更新で、影響のない行が再描画されないこと。
    - `onExpanderClick` / `removeHiddenTasks` / `sortTasks` の回帰がないこと。
  - ベンチマーク:
    - 1k / 10k / 50k 件に対して `render`, `scroll`, `dependency resolution`, `task update` の中央値・p95 を記録する。
    - 改善前後の差分を比較し、変化が顕著な項目を優先的に最適化対象とする。
- モック / フィクスチャ方針:
  - jsdom ではレイアウト計算がないため、表示領域サイズ・スクロール量・`getBoundingClientRect` / `getBBox` をモックする。
  - 依存の可視性判定は `scrollY`, `rowHeight`, `ganttHeight`, `visibleStartIndex` を直接制御してテストし、ブラウザ依存の計算式を固定する。
  - ベンチマークは `performance.now()` を用い、ブラウザ実行前提とし、CI では `npm test` の通常 unit テストと分離する。CI で継続的に実行するかは、実行時間と安定性を見て最小限の smoke ベンチマークに限定する。
- 配置先:
  - `src/test/virtualization.test.tsx`
  - `src/test/bar-helper-dependency.test.tsx`
  - `src/test/gantt-scroll-sync.test.tsx`
  - `src/test/benchmark/*.bench.ts` または `src/test/perf/*.test.tsx`（実装フェーズで配置）
- 実行コマンド:
  - `npm run test:unit`（CI では `npm test` の一部として実行）
  - ベンチマークは `npm run test:unit -- --runInBand --watch=false` の範囲ではなく、手動または専用スクリプトで計測する

## 5. CI 品質ゲート

- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm ci`
  - `npm run test:unit`
  - `npm run test:lint`
  - `npm run test:build`
  - `npm audit`（プロジェクトのセキュリティゲート）
- 通過基準と失敗時の対応:
  - `npm run test:unit` で仮想化・依存関係回帰がすべて通ること。
  - `npm run test:lint` が eslint に合格すること。
  - `npm run test:build` が TypeScript / microbundle のビルドを通ること。
  - `npm audit` が fail-closed であるため、重大な新規脆弱性が見つかった場合は例外台帳の更新と根拠記録を行い、依存更新または別 Issue 化を明確にする。
  - 失敗時は再現条件・原因・修正方針を PR に残し、設計のロールバック条件を再確認する。

## 6. ロールアウト・運用

- ロールバック方法:
  - 仮想化を `ganttHeight` / opt-in フラグで制御し、異常時はフラグのみ無効化して現行全行描画へ戻す。
  - 依存マップ最適化は小さな単位で導入し、一段ずつ `normalizeTaskDependencies` と `convertToBarTasks` の差分を切り分けて回帰確認する。
  - 画面外依存線の間引きは、`visibleTasks` の計算ロジックが崩れた場合にすぐ `renderAll` フォールバックへ切り替えられるようにする。
- 監視・運用上の注意:
  - ベンチマーク結果を継続的に追跡し、10k / 50k での主要メトリクスが悪化した場合は、先に `visible range` 計算・依存マップの実装を見直す。
  - `rowHeight` の固定前提と `ganttHeight` 未指定時の互換性に注意し、将来の可変行高対応は個別に設計する。
  - 画面外アンマウントによる焦点やドラッグの破綻があれば、ハイドレート方式や `keep-alive` 相当の保護を追加する。

## 7. オープンな課題 / ADR 要否

- 未確定事項:
  - 依存ライブラリを導入する必要があるかは、ベンチマークの結果次第で決定する。自前実装が十分に高速であれば追加しない。
  - `ganttHeight` 未指定時に仮想化を有効にするかは、互換性の観点から opt-in とし、既存挙動を維持する。
  - 水平方向の描画最適化（日付列ごとの縦線・非稼働日 `rect`）は、初期実装で必須ではないが、10k / 50k 件でボトルネックと判明した場合に継続改善範囲とする。
- ADR に残すべき判断:
  - `rowHeight` が固定であることを前提とする場合、ADR は不要である。
  - 可変行高対応、外部仮想化ライブラリ導入、公開 API に破壊的変更を加える場合のみ ADR を作成する。
  - 本 plan では公開 API 変更なし・可変行高対応なし・opt-in のみを前提とするため、ADR は不要と判断する。

## 8. 実装受入条件

- 表示タスク数に比例して DOM/SVG 要素が無制限に増加しない。
- 10k / 50k 件のデータでも、表示領域内の行を中心に描画できる。
- 依存関係の検索で、タスク配列に対する繰り返し線形探索を避け、`Map` で解決された依存の可視範囲のみを処理できる。
- スクロール、タスクのドラッグ、編集、依存線の表示が仮想化後も正常に動作する。
- 改善前後の性能比較が可能なベンチマークと測定結果が用意される。
- 既存 API と表示・編集機能の互換性が維持される。
- 本 plan の設計と実装フェーズの完了条件を満たすまで、過剰なスコープ拡張を行わない。

## コードレビューフィードバック対応（Review Feedback Response）

### 追記（今回分）

- フィードバック（要約）：依存関係の設計記述が「`findIndex` ベースの線形探索が現状実装である」前提と誤解されている。対応（何を変えた）：現行コードがすでに `Map` / `Set` による依存索引を採用している前提へ記述を修正し、残作業を「可視範囲フィルタと再計算抑制」に限定した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `src/helpers/bar-helper.ts:164-193` / `src/helpers/other-helper.ts:38-54` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：非機能要件で「依存解決コストが O(T × D) の反復検索から改善する」と書いていたが、現実装では `Map`/`Set` 依存構築済み。対応（何を変えた）：要件文を「`Map` / `Set` ベース索引を前提とし、追加で必要な最適化は可視範囲の絞り込みと再計算抑制に限定する」と更新し、過剰な「置換」表現を削除した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 1. 機能要件 / 非機能要件` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：受入条件で「依存関係の検索でタスク配列に対する繰り返し線形探索を避ける」となっており、現実装とのズレが残っていた。対応（何を変えた）：受入条件を「`Map` で解決された依存の可視範囲のみを処理する」に修正し、現行の設計と一致させた。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 8. 実装受入条件` / 本更新。状態（対応済/保留/却下）：対応済。
