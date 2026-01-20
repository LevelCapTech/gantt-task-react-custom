# dnd-kit を用いたガント行ドラッグ／階層化 PoC

## 目的
- `dnd-kit` の `SortableContext` + DragHandle 構成でタスクリスト行を並べ替えできるか確認。
- 横方向移動量をインデントに反映し、親子関係（`project`）を変えられるかを検証。
- 並べ替え結果が `Gantt` 描画に同期されるかを目視確認。

## 実装サマリ
- `/src/dnd/` に PoC を配置し、`DndGanttPlayground` としてエクスポート。
  - 縦方向の並べ替え: `SortableContext` + `verticalListSortingStrategy`。
  - 階層化: 横方向移動量を 24px 単位で丸め、`project` を前行に付け替える `applyIndentSteps` を実装。
  - サブツリー移動: `moveTaskWithChildren` で親を動かすと子もまとめて移動。
  - 見た目: Drag Handle 付き行リスト + 右側に同期された Gantt プレビュー。
- サンプルデータは `sample-tasks.ts` に分離（プロジェクト2件 + マイルストーン）。
- 例示 UI を `example` アプリに追加（見出し「dnd-kit 行ドラッグ PoC」）。

## 動作確認手順
1. ルートで依存を取得（済みの場合は不要）: `npm install`
2. 例示アプリを起動: `cd example && npm install && npm start`
3. ブラウザで `http://localhost:3001` を開き、ページ下部の「dnd-kit 行ドラッグ PoC」を操作。
   - ハンドル（☰）をドラッグして上下入れ替え。
   - 水平方向に少し移動するとインデント/アウトデントが適用され、右側の Gantt も同期する。
4. 自動テスト: ルートで `npm test -- --watch=false`（純関数ユーティリティの回帰確認を含む）。

## 観察結果
- ハンドル限定ドラッグで隣接リストの並べ替えが安定動作。
- 親行を移動すると子行もまとめて移動し、`project` 参照は維持される。
- インデント操作は前行を親に設定する方式のため、最大深度は「直前行の深さ+1」に自然に制限される。
- `Gantt` 側は `tasks` 配列更新のみで同期され、追加の副作用は不要。

## 課題・リスク
- collisionDetection は `closestCenter` をそのまま使用。多段階の入れ子判定やスナップ位置のカスタムは未実装。
- インデントは水平方向移動量を単純丸めしているため、トラックパッド大移動で過剰に反応する可能性あり（丸め幅は `INDENT_WIDTH_PX` で調整可）。
- 長大リストでの仮想化や自動スクロールは未検証。
