# 大規模タスク (10k〜50k件) 向け描画仮想化と依存関係解決の高速化 plan

## 1. 機能要件 / 非機能要件

- 機能要件:
  - 1k / 10k / 50k 件のタスクデータで、初期描画・スクロール・タスク編集・依存関係解決の性能を定量計測するベンチマーク基盤を整備する。
  - 行の仮想化を導入し、表示領域と予測されるバッファ領域に収まるタスク行のみを描画し、画面外のタスク行をアンマウントまたは非表示にする。
  - 仮想化の有効条件は `enableVirtualization?: boolean` の任意 Prop を追加し、既定値は `false` とする。`ganttHeight > 0` かつ `enableVirtualization === true` の場合のみ仮想化が有効となる。`ganttHeight` が `0` / 未指定、または `enableVirtualization` が `undefined` / `false` の場合は従来の全行表示を維持する。
  - 依存線の描画は「少なくとも片端が実 viewport 内である依存のみ候補化し、両端が viewport 外なら描画しない」方針を採用する。表示範囲に入る依存のみに描画し、SVG viewport の境界線でクリップする。
  - タスク更新時の再レンダリングを抑制し、影響がない行・セル・依存線を再利用または描画対象から除外する。
  - 既存の `rowHeight` 固定レイアウトと公開 API を維持し、仮想化は `enableVirtualization` が `true` で `ganttHeight > 0` のときのみ有効化する。未指定時は既存の全行表示を維持する。
  - 依存モデルの整合性を `normalizeTaskDependencies` と `dependencyLinks` / `dependencies` の共通化に沿って維持し、Issue #139 の依存関係拡張との整合を確認する。現 head では `convertToBarTasks` / `buildDependencyChildrenMap` が既に Map ベースであることを前提に残作業を切り分ける。
  - 画面外タスクがアンマウントされても、編集中行・選択中行・フォーカス中セル・ドラッグ中状態が破損しないように戦略を持つ。
- 非機能要件:
  - 10k / 50k 件でも表示領域内の行を中心に描画し、DOM/SVG 要素数が無制限に増えない構造を維持する。
  - 依存解決コストは現状の `Map` / `Set` ベースの索引を再利用し、残りの最適化は viewport での候補抽出と再計算抑制に限定する。`findIndex` などの反復線形探索を新たに導入しない。
  - スクロール、ドラッグ、セル編集、依存線描画が仮想化後も利用可能なことを受け入条件とする。
  - 既存の API と表示互換性を保ち、後方互換な公開 API 追加のみを行う。`enableVirtualization` はオプショナルな boolean Prop であり、既存コードの破壊は行わない。
  - 依存追加やライブラリ導入は最小限とし、`peerDependencies` / `dependencies` の対象と理由を明確にする。

## 2. スコープと変更対象

- 変更ファイル（新規/修正/削除）:
  - 主要実装対象（実装フェーズで変更予定）:
    - `src/components/gantt/gantt.tsx` — スクロール同期、表示範囲計算、仮想化のハブ、`ganttHeight` と `enableVirtualization` の条件分岐
    - `src/components/gantt/task-gantt-content.tsx` — 表示範囲での `TaskItem` / `Arrow` 描画、依存線の候補抽出と可視性フィルタ
    - `src/components/task-list/task-list.tsx` / `task-list-table.tsx` — 左ペインの仮想化とスクロール同期
    - `src/components/grid/grid-body.tsx` — 行背景・区切り・非稼働日描画の表示範囲制限
    - `src/helpers/bar-helper.ts` — 現 head で既にある `Map` / `Set` 依存索引の維持と、viewport の依存候補抽出の追加実装
    - `src/helpers/other-helper.ts` — `removeHiddenTasks` / `getChildren` を仮想化対応へ再構成し、折りたたみ描画に対する表示範囲を考慮
    - `src/types/public-types.ts` — `enableVirtualization?: boolean` の後方互換な公開 API 追加（既存 Props は維持）
    - `src/test/**/*.test.tsx` — 仮想化・依存解決・スクロール同期の回帰テスト
    - ベンチマーク導入先: `src/test/perf/` に固定し、ブラウザ計測と Jest/jsdom 計測を分離する
  - 設計成果物:
    - `.github/copilot/plans/140-large-scale-virtualization.md`（本ファイル）
- 影響範囲・互換性リスク:
  - 既存の公開 Props は維持し、仮想化は新規オプション `enableVirtualization?: boolean` を追加する。`ganttHeight` 未指定または `0` では従来の全行表示、`enableVirtualization` 未指定または `false` では `ganttHeight > 0` のときも従来描画を維持する。`ganttHeight > 0` かつ `enableVirtualization === true` のときのみ仮想化が有効になる。
  - `overscan` は公開 Prop ではなく、内部定数として定義する。値は `OVERSCAN_ROWS = 3` と固定し、変更が必要なときだけ内部定数を更新する。候補名の列挙は行わない。
  - 行高さは現状の固定 `rowHeight` を前提とする。可変高さ対応は本 issue の対象外とし、将来的に拡張時に ADR を検討する。
  - 依存描画は「少なくとも片端が実 viewport 内なら候補化し、両端とも viewport 外なら描画しない」という仕様を採用する。折りたたみで非表示の端点は現行仕様を維持し、`overscan` は依存線の可視判定とは別に扱う。
  - 画面外行のアンマウント時に編集中コンポーネントや `getBBox()` ベースの幅計測が壊れないよう、アクティブ編集中/選択中のタスクは `activeTaskIds` と `keep-alive` を用いて管理し、再描画時に位置を再計算する。
  - 公開 API の変更は「後方互換な公開 API 追加」として扱い、破壊的変更は行わない。ADR は本 issue で不要とし、既存 API との互換性の前提をそのまま plan に記す。
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
    - `normalizeTaskDependencies` で依存の正規化と重複排除を通し、共通の依存モデルを `src/helpers/bar-helper.ts` に保持する。現 head の `normalizeTaskDependencies` は重複排除と `dependencyLinks` / `dependencies` の正規化をすでに実装している。
    - `convertToBarTasks` はタスク変換と `barChildren` / `barDependencyChildren` の組み立てを行い、レンダリング側は表示範囲の `tasks` を受け取るだけにする。現 head では `barTaskMap`, `childrenMap`, `edgeMap` を用いた Map ベースがすでに存在する。
    - `gantt.tsx` は縦スクロール値と表示範囲を決定し、行一覧・グリッド・タイムラインの表示範囲をずらし、見えているタスク集合の計算を一元化する。
    - `TaskGanttContent` は表示範囲に絞った `tasks` のみを描画し、依存線も同じ visible set に基づいて候補抽出する。`Arrow` は `barDependencyChildren` から viewport 内候補だけを受け取り、両端が viewport 外なら描画しない。
    - `GridBody` は行背景と区切りを `visibleStartIndex` / `visibleEndIndex` で描画し、水平方向の大きな SVG も必要な範囲だけを描画対象にする。
- 座標・仮想化アルゴリズム:
  - `OVERSCAN_ROWS = 3` を内部定数として定義し、公開 API に出さない。
  - `scrollY` を `rowHeight` で割って開始インデックスを計算し、`visibleStartIndex = clamp(floor(scrollY / rowHeight) - OVERSCAN_ROWS, 0, max(0, totalTasks - 1))` と定義する。
  - `visibleEndIndex = clamp(ceil((scrollY + ganttHeight) / rowHeight) + OVERSCAN_ROWS, 0, totalTasks - 1)` とし、表示候補は `tasks.slice(visibleStartIndex, visibleEndIndex + 1)` とする。
  - `full-height spacer` を `totalTasks * rowHeight` として設定し、各タスクの `absoluteY = taskIndex * rowHeight` を基準に `position: absolute` または `transform: translateY(...)` で配置する。
  - 左ペイン、グリッド、タイムライン、依存線の `Arrow` は同一の `visibleStartIndex/EndIndex` と `absoluteY` を共有し、座標計算は 1 つの `viewportGeometry` に集約する。
  - スクロール更新時の無限再レンダリングを防ぐため、`visibleStartIndex` / `visibleEndIndex` が実際に変化したときのみ再計算し、長い処理は `useMemo` / `useCallback` で境界条件を固定する。
  - `scrollY` 変更は `TaskList` / `Grid` / `Timeline` の 1 つをソースとし、他コンポーネントは同一値を受け取ることで更新ループを防止する。
- エッジケース / 例外系 / リトライ方針:
  - 表示領域が縦方向に 0 になる場合: `visibleStartIndex` / `visibleEndIndex` を clamp し、空の描画を返す。
  - 依存線の可視仕様は以下の表に定義する。

    | ケース | 期待値 | 実装方針 |
    |---|---|---|
    | 両端が viewport 内 | 描画 | 両端を候補として生成し、SVG viewport でクリップ |
    | 片端のみ viewport 内 | 1 本だけ描画 | 片端側の座標を viewport 内に clamp し、もう一方はクリップ |
    | 両端とも viewport 外 | 非描画 | `visibleSet` に両端がない場合は候補から除外 |
    | 折りたたまれた端点 | 現行仕様維持 | `hidden` / `collapsed` の端点は依存候補から除外しないが、表示しない |
    | overscan のみに存在する端点 | 非描画 | overscan は描画補完のためであり、依存可視性判定には使わない |

  - 依存線の重複: `dependencyKey` と `Set` で重複削除し、`dependencyLinks` と `dependencies` が同時に存在する場合も同一解釈に統一する。現 head では `normalizeTaskDependencies` が重複排除と `taskIds` 検証を行っているため、未確認の「FS に統一」や「空配列の特殊扱い」は plan では断定しない。
  - `normalizeDependencyLink` の現行挙動: `type === undefined` は `FS` にデフォルト化し、無効な非 `undefined` 型は除外する。これは `undefined` と「無効な識別子」を区別することを意味し、`FS` の強制適用と無効型除外の両方を plan に明記する。
  - 折りたたみ状態: `removeHiddenTasks` を先に適用し、仮想化の visible set が折りたたみ後の展開タスクと整合するように計算する。`getChildren` の再帰的探索は `filter` / `indexOf` を増やさず、事前に `Map` 化して再利用する。現 head の `buildDependencyChildrenMap` は Map 化済みであり、残るボトルネックは全行/全矢印描画やスクロール時の再計算である。
  - `scrollY` と `TaskList` / `TaskGantt` の同期: 1 つのスクロール源を保持し、左右のスクロール同期と同様に単一の状態更新でパイプラインを簡潔に保つ。
  - 画面外アンマウントによる編集中セル破損: `isSelected` / `isEditing` / `dragging` の状態を持つタスクだけは `keep-alive` 相当の扱いを行い、viewport から外れても同一コンポーネントのライフサイクルを維持する。
  - 依存検索の消失: `task.id` 一意性が崩れるケースは除外し、既存の `Task` 型と `BarTask` の ID を用いた index を前提に設計する。
  - 自前実装とライブラリ導入の比較: 初期実装は固定 `rowHeight` を前提に自前実装で進め、非本質的なケースのみ外部仮想化ライブラリ導入を検討する。導入に際しては bundle / peerDependencies / React 18 並行対応を明記する。
- ログと観測性（漏洩防止を含む）:
  - ベンチマークの結果は `console.table` やテスト出力に統一し、個人情報や実データは含めない。
  - 依存関係や visible set の計算は診断用に `debug` フラグを持つが、公開 API では出さず、必要時のみ dev build で有効にする。
  - 実装中に `console.error` を使う場合は、エラー内容を要約したメッセージに留め、タスク ID や依存 ID の詳細が必要な場合はダミー化する。
  - ベンチマーク結果は `docs/perf/` もしくは `src/test/perf/` の定義に合わせて記録し、課題と改善前後の比較を残す。

## 4. テスト戦略

- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 依存関係解決:
    - `normalizeTaskDependencies` と `convertToBarTasks` で、`dependencies` / `dependencyLinks` の両方が同一結果になることを確認する。現 head では依存の正規化と重複排除が既に存在するため、追記作業は「依存候補抽出」と「可視化の差分」に限定する。
    - 重複依存が排除されること、存在しない依存 ID が無視されることを確認する。型の扱いは、現 head で `normalizeDependencyLink` が `type === undefined` を `FS` にデフォルト化し、無効な非 `undefined` 型を除外する動作を確認した結果として記録し、`FS` の強制適用と除外の区別を明確にする。
  - 仮想化:
    - 表示領域外の行は render されないこと。
    - 表示対象とバッファ分の行だけが描画され、タスク数を増やしても描画要素数が一定範囲に収まること。
    - スクロール位置に応じて描画される行が変わり、先頭・末尾の境界を含む切り替えが正しいこと。
    - `ganttHeight` 未指定時または `enableVirtualization` が `false` のときは従来の全行描画が維持されること。
    - `ganttHeight > 0` かつ `enableVirtualization === true` の組み合わせのみが仮想化有効になることを全パターンで検証する。
  - スクロール同期:
    - 左ペインの縦スクロールとタイムラインの縦スクロールが同期すること。
    - `scrollY` 変化で `visibleStartIndex` / `visibleEndIndex` が正しく更新されること。
    - 計算が同一でも `setState` が同一値へ落ちる場合は更新ループを防止すること。
  - 依存線描画:
    - 両端とも viewport 外なら依存線は描画されないこと。
    - 依存元または依存先の一方だけが可視なら、少なくとも片端が viewport 内である場合のみ候補化され、SVG viewport でクリップされること。
    - `task.barDependencyChildren` と `Arrow` の描画が、画面外依存を省略した場合でも整合すること。
    - `overscan` のみに存在する依存線は描画しないこと。
  - 主要イベント:
    - 展開・折りたたみ、並べ替え、選択、セル編集、バーのドラッグが仮想化後も動作すること。
    - 1 件のタスク更新で、影響のない行が再描画されないこと。
    - `onExpanderClick` / `removeHiddenTasks` / `sortTasks` の回帰がないこと。
    - キーボード操作、overlay editor、drag 中の画面外移動でも編集状態・フォーカス状態が復帰可能であること。
    - `getBBox()` の再計測後に `Arrow` の座標がずれないこと。
  - ベンチマーク:
    - ベースラインを最初に計測し、次に仮想化導入後の比較を行う。計測順序は「baseline / virtualized / optimized 」の 3 段階で固定する。
    - 生成データは固定 seed を用いて 1k / 10k / 50k 件を作り、依存密度、階層数、日付列数、`rowHeight` を固定する。バリエーションは 1 つの基準セットに統一し、乱数依存の差異を避ける。
    - 実行環境は Chrome / Playwright ベースの browser benchmark と、Jest/jsdom は unit テスト専用と分離する。ブラウザ側は `viewport = 1200x700`, `rowHeight = 32`, `ganttHeight = 600` を基準に測定する。
    - 1 回の計測は `warmup = 5`, `iterations = 30` で固定し、各操作の区間を明確に切る: `initial render`, `scroll`, `dependency resolution`, `task update`, `collapse/expand`.
    - 計測メトリクスは `median`, `p95`, `DOM node count`, `SVG node count`, `rendered task count` を保存して比較する。
    - 保存先は `docs/perf/large-scale-virtualization/` 配下に `benchmark-summary.md` と `benchmark-results.csv` を置く。結果は before / after の表で残す。
    - 再実行コマンドは `npm run benchmark:large-gantt -- --sizes=1000,10000,50000 --seed=42 --viewport=1200x700 --warmup=5 --iterations=30` とする。数値で判定し、性能受入基準に達しないときは未達原因を明記し、実装を止めるか要件の調整を PR に残す。
    - 受入基準は「初期描画 median / 10k 件で 2x 以上改善」「スクロール median / 50k 件で 3x 以上改善」「SVG 要素数が表示範囲に比例して抑制」など、数値に落とした形で示す。未達時は gory な要件が破棄ではなく、現実装での改善余地と次のアクションを記録する。
- モック / フィクスチャ方針:
  - jsdom ではレイアウト計算がないため、表示領域サイズ・スクロール量・`getBoundingClientRect` / `getBBox` をモックする。
  - 依存の可視性判定は `scrollY`, `rowHeight`, `ganttHeight`, `visibleStartIndex` を直接制御してテストし、ブラウザ依存の計算式を固定する。
  - ベンチマークは `performance.now()` を用い、ブラウザ実行前提とし、CI では `npm test` の通常 unit テストと分離する。CI で継続的に実行するかは、実行時間と安定性を見て最小限の smoke ベンチマークに限定する。
- 配置先:
  - `src/test/virtualization.test.tsx`
  - `src/test/bar-helper-dependency.test.tsx`
  - `src/test/gantt-scroll-sync.test.tsx`
  - `src/test/perf/virtualization-benchmark.browser.ts`
  - `src/test/perf/virtualization-benchmark.spec.ts`
- 実行コマンド:
  - `npm ci`
  - `npm test`（unit / lint / build をまとめて実行）
  - `npm audit`
  - `npm run benchmark:large-gantt -- --sizes=1000,10000,50000 --seed=42 --viewport=1200x700 --warmup=5 --iterations=30`

## 5. CI 品質ゲート

- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm ci`
  - `npm test`
  - `npm audit`
  - `docs/REBUILD.md` に沿って example の手動確認を行う
- 通過基準と失敗時の対応:
  - `npm test` で仮想化・依存関係回帰がすべて通ること。
  - ESLint / TypeScript / microbundle のビルドが成功すること。
  - `npm audit` が fail-closed であるため、重大な新規脆弱性が見つかった場合は例外台帳の更新と根拠記録を行い、依存更新または別 Issue 化を明確にする。
  - 失敗時は再現条件・原因・修正方針を PR に残し、設計のロールバック条件を再確認する。

## 6. ロールアウト・運用

- ロールバック方法:
  - 仮想化は `enableVirtualization` と `ganttHeight` の両方で制御し、異常時は `enableVirtualization` を `false` にして従来の全行描画へ戻す。`ganttHeight > 0` 単独では有効化しない。
  - 依存マップ最適化は小さな単位で導入し、一段ずつ `normalizeTaskDependencies` と `convertToBarTasks` の差分を切り分けて回帰確認する。既存 Map ベースの再利用と、依存候補抽出の追加だけを個別にレビューする。
  - 画面外依存線の間引きは、`visibleTasks` の計算ロジックが崩れた場合にすぐ `renderAll` フォールバックへ切り替えられるようにする。
- 監視・運用上の注意:
  - ベンチマーク結果を継続的に追跡し、10k / 50k での主要メトリクスが悪化した場合は、先に `visible range` 計算・依存候補抽出の実装を見直す。
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
  - 本 plan では公開 API の後方互換な任意 Prop 追加・可変行高対応なし・opt-in のみを前提とするため、ADR は不要と判断する。

## 8. 実装受入条件

- 表示タスク数に比例して DOM/SVG 要素が無制限に増加しない。
- 10k / 50k 件のデータでも、表示領域内の行を中心に描画できる。
- `enableVirtualization` が `false` / 未指定または `ganttHeight <= 0` の場合は、従来の全行描画が維持される。
- `enableVirtualization === true` かつ `ganttHeight > 0` のときにのみ仮想化が有効となり、依存候補は `Map` ベースの `barDependencyChildren` から viewport 件数に絞って処理される。
- スクロール、タスクのドラッグ、編集、依存線の表示が仮想化後も正常に動作する。
- ベンチマーク結果（median / p95 / DOM/SVG 数 / before-after 比較）が `docs/perf/large-scale-virtualization/` に保存され、数値基準を満たすこと。
- 既存 API と表示・編集機能の互換性が維持される。
- 本 plan の設計と実装フェーズの完了条件を満たすまで、過剰なスコープ拡張を行わない。

## コードレビューフィードバック対応（Review Feedback Response）

### 追記（今回分）

- フィードバック（要約）：依存関係の設計記述が「`findIndex` ベースの線形探索が現状実装である」前提と誤解されている。対応（何を変えた）：現行コードがすでに `Map` / `Set` による依存索引を採用している前提へ記述を修正し、残作業を「可視範囲フィルタと再計算抑制」に限定した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `src/helpers/bar-helper.ts:164-193` / `src/helpers/other-helper.ts:38-54` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：非機能要件で「依存解決コストが O(T × D) の反復検索から改善する」と書いていたが、現実装では `Map`/`Set` 依存構築済み。対応（何を変えた）：要件文を「`Map` / `Set` ベース索引を前提とし、追加で必要な最適化は可視範囲の絞り込みと再計算抑制に限定する」と更新し、過剰な「置換」表現を削除した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 1. 機能要件 / 非機能要件` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：受入条件で「依存関係の検索でタスク配列に対する繰り返し線形探索を避ける」となっており、現実装とのズレが残っていた。対応（何を変えた）：受入条件と依存前提を `Map` ベースの実装に整合させ、`findIndex` を新規導入しないことを明記した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 8. 実装受入条件` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：`normalizeDependencyLink` の `type === undefined` と無効型の扱い、公開 API 追加の記述、bench の実行方式が曖昧だった。対応（何を変えた）：`type === undefined` を `FS` にデフォルト化し、無効な非 `undefined` 型は除外することを明記し、`enableVirtualization` による後方互換な公開 API 追加と、browser benchmark / jsdom 分離、固定 seed の計測ルール、measurement command を 1 系統に定義した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 2. スコープと変更対象`, `## 3. 設計方針`, `## 4. テスト戦略`, `## 5. CI 品質ゲート` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：仮想化の start/end 計算・座標共有・スクロール更新ループ防止・依存線の候補抽出が未確定だった。対応（何を変えた）：`OVERSCAN_ROWS = 3` と `visibleStartIndex` / `visibleEndIndex` の計算式、`full-height spacer` / `absoluteY` の共有、`activeTaskIds` による編集・選択・drag の保持、依存線の候補条件テーブルを追加した。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / `## 3. 設計方針`, `## 4. テスト戦略` / 本更新。状態（対応済/保留/却下）：対応済。
- フィードバック（要約）：レビュー依頼の最終段で「PR本文が未更新」「`tasks.filter(...)` の全件走査サンプルが残っている」「既存レビューへの返信を追加してほしい」と指摘があった。対応（何を変えた）：本 PR は設計 plan のみの変更であり、PR 本文は維持したまま末尾のレビュー対応追記だけを更新し、`tasks.filter(...)` の全件走査を意図する説明を plan から削除して候補抽出の重複除去・visible set での絞り込みに置き換えた。対象（ファイル/行/Commit）：`.github/copilot/plans/140-large-scale-virtualization.md` / 本更新。状態（対応済/保留/却下）：対応済。
