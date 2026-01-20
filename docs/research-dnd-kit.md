# dnd-kit を用いたガント行ドラッグ／階層化 PoC

## 目的
- 本リポジトリにはコードを含めない（調査タスクの方針に従い、PoC コードは手元検証のみ）。
- `dnd-kit` の `SortableContext` + DragHandle 構成でタスクリスト行を並べ替えできるか確認。
- 横方向移動量をインデントに反映し、親子関係（`project`）を変えられるかを検証。
- 並べ替え結果が `Gantt` 描画に同期されるかを目視確認。

## 実装サマリ
- ローカル検証では `/src/dnd/` に PoC を配置し、`DndGanttPlayground` として構成（本コミットには含まず）。
  - 縦方向の並べ替え: `SortableContext` + `verticalListSortingStrategy`。
  - 階層化: 横方向移動量を 24px 単位で丸め、`project` を前行に付け替える `applyIndentSteps` を実装。
  - サブツリー移動: `moveTaskWithChildren` で親を動かすと子もまとめて移動。
  - 見た目: Drag Handle 付き行リスト + 右側に同期された Gantt プレビュー。
- サンプルデータは `sample-tasks.ts` に分離（プロジェクト2件 + マイルストーン、ローカルのみ）。
- 例示 UI を `example` アプリに追加して確認（本コミットには未含有）。

## 動作確認手順
ローカルで PoC コードを適用した上での検証手順（本コミットにはコードを含めないため参考情報）:
1. ルートで依存を取得: `npm install`
2. 例示アプリを起動: `cd example && npm install && npm start`
3. ブラウザで `http://localhost:3001` を開き、ページ下部の「dnd-kit 行ドラッグ PoC」を操作。
   - ハンドル（☰）をドラッグして上下入れ替え。
   - 水平方向に少し移動するとインデント/アウトデントが適用され、右側の Gantt も同期する。
4. 純関数ユーティリティの確認: ルートで `npm test -- --watch=false`。

## 観察結果
- ハンドル限定ドラッグで隣接リストの並べ替えが安定動作。
- 親行を移動すると子行もまとめて移動し、`project` 参照は維持される。
- インデント操作は前行を親に設定する方式のため、最大深度は「直前行の深さ+1」に自然に制限される。
- `Gantt` 側は `tasks` 配列更新のみで同期され、追加の副作用は不要。

## 追加調査（/src/dnd 配下ソース配置後）

### ソース構成の要点
- packages/react: `useSortable`, `DragOverlay`, `SortableContext` など React 向けプリセット（Storybook Tree/MultipleLists 例あり）。
- packages/dom: ポインタ/キーボードセンサー、スクロールロック、オートスクロール、アクセシビリティ対応プラグイン。
- packages/collision: `closestCenter`, `closestCorners`, `shapeIntersection`, `pointerIntersection` などのアルゴリズム群。
- packages/helpers: リスト移動ユーティリティ（`move`）。  
- apps/stories/react/Sortable/Tree: 階層ツリーの実装例（インデント/アウトデントとサブツリー移動の参考）。

### ガントへの適用性評価
- **行並べ替え**: `SortableContext` + `useSortable` を TaskList 行に適用するだけで縦方向の並べ替えは実現可能。
- **階層化（親子変更）**: Tree ストーリーのアプローチ（ドラッグ中の水平移動量でインデント決定）がそのまま流用可能。`Tree.tsx` の `getProjection` と `flattenTree` が参考。
- **状態同期**: 並べ替え・階層変更後に `tasks`（`project` と `displayOrder`）を更新すれば既存の `Gantt` 描画に伝搬する。追加の副作用は不要。
- **collisionDetection**: 初期は `closestCenter` で十分。子リストが多い場合は `pointerIntersection` や `shapeIntersection` を試す余地あり。
- **キーボード/アクセシビリティ**: packages/dom の KeyboardSensor と Accessibility プラグインを組み合わせることで、ハンドル操作のキーボード対応が可能。
- **スクロール**: `AutoScroller` プラグインが利用可能。長大リストでの追従に有効。

### 推奨 PoC 手順（本体コードには含めない想定）
1. TaskList 行を `DndContext` / `SortableContext` でラップし、ハンドルのみドラッグ可能にする。
2. Tree 例の `getProjection` をベースに、水平移動量からインデント段数を算出し `project` を付け替える（ルートの負インデントは禁止）。
3. サブツリー移動: ドラッグ元タスクと子孫をまとめて再配置（Tree 例の `flattenTree`/`buildTree` ロジックを流用）。
4. 衝突検出: まず `closestCenter`、必要に応じて `pointerIntersection` を切り替え検証。
5. UI 同期: `tasks` の並びと `project` を更新後、そのまま `Gantt` に渡す。`displayOrder` を再計算しておくと安定。
6. 追加オプション: `AutoScroller` で縦スクロール、KeyboardSensor でキーボード操作を確認。

### リスク・留意点
- `/src/dnd` は大規模なソースであり、全体をビルドに組み込むとバンドルサイズが増大するため、PoC では必要部分のみインポートする。
- ツリーデータの再計算コストがリスト長に線形で発生するため、長大リストでは仮想スクロールや計算のメモ化が必要。
- 水平移動によるインデント判定はポインタ移動量に依存するため、トラックパッド利用時はヒステリシスやスナップ閾値の調整が必要。
- `collisionDetection` をカスタムする場合、最小矩形が重なるだけでヒットするケースがあり、明示的な「行高さ」基準で調整する必要がある。

### 次のアクション（提案）
- Tree ストーリーのロジックを参考にした最小 PoC を `/src/dnd` 配下に別名で作成し、TaskList への統合可否を確認（本体改変なし）。
- `AutoScroller` と KeyboardSensor を有効化した操作性チェック。
- 衝突アルゴリズムの比較（`closestCenter` / `pointerIntersection` / `shapeIntersection`）とインデント閾値のチューニング結果を追記。

## 課題・リスク
- collisionDetection は `closestCenter` をそのまま使用。多段階の入れ子判定やスナップ位置のカスタムは未実装。
- インデントは水平方向移動量を単純丸めしているため、トラックパッド大移動で過剰に反応する可能性あり（丸め幅は `INDENT_WIDTH_PX` で調整可）。
- 長大リストでの仮想化や自動スクロールは未検証。
