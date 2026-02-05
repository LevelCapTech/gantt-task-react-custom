# gantt-task-react

## ライセンス
MIT

元になったプロジェクト:
https://github.com/MaTeMaTuK/gantt-task-react

## TypeScript を用いた React 向けのインタラクティブなガントチャート。

![example](https://user-images.githubusercontent.com/26743903/88215863-f35d5f00-cc64-11ea-81db-e829e6e9b5c8.png)

## [ライブデモ](https://levelcaptech.github.io/gantt-task-react-custom/)

## インストール

```
npm install gantt-task-react
```

## Requirements

- React: 18.x（必須）
  - 本プロジェクトは `react` / `react-dom` の peerDependencies として `^18.0.0` を指定しています。
  - **React 18 系のみを正式サポート**しています。
  - React 17 / 16 は非サポートです。

## DevContainer（npm publish 対応）

VS Code Dev Containers で npmjs.com への publish を行う環境を用意しています。セットアップと利用方法は [docs/DEVCONTAINER.md](docs/DEVCONTAINER.md) を参照してください。

## 使い方

```javascript
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";

let tasks: Task[] = [
    {
      start: new Date(2020, 1, 1),
      end: new Date(2020, 1, 2),
      name: 'Idea',
      id: 'Task 0',
      type:'task',
      progress: 45,
      isDisabled: true,
      styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
    },
    ...
];
<Gantt tasks={tasks} />
```

次のアクションを処理できます

```javascript
<Gantt
  tasks={tasks}
  viewMode={view}
  onDateChange={onTaskChange}
  onTaskDelete={onTaskDelete}
  onProgressChange={onProgressChange}
  onDoubleClick={onDblClick}
  onClick={onClick}
/>
```

## example の起動方法

```
cd ./example
rm -rf node_modules
npm install
npm start
```

注意:
- このリポジトリでは `npm link` や手動 symlink を使用しないでください。React の二重読み込みが発生し、「Invalid hook call」を引き起こす可能性があります。
- ルートの `package.json` やビルド設定を変更した場合は、`docs/REBUILD.md` に従って全体のリビルド手順を実施してください。

## Gantt 設定

### GanttProps

| パラメーター名                  | 型            | 説明                                               |
| :------------------------------ | :------------ | :------------------------------------------------- |
| tasks\*                         | [Task](#Task) | タスク配列。                                       |
| [EventOption](#EventOption)     | interface     | ガントのイベントを指定します。                     |
| [DisplayOption](#DisplayOption) | interface     | 表示タイプとタイムライン表示言語を指定します。     |
| [StylingOption](#StylingOption) | interface     | チャートとタスクのグローバルスタイルを指定します。 |

### EventOption

| パラメーター名     | 型                                                                            | 説明                                                                                    |
| :----------------- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| onSelect           | (task: Task, isSelected: boolean) => void                                     | タスクバーの選択/選択解除時に実行する関数を指定します。                                 |
| onDoubleClick      | (task: Task) => void                                                          | タスクバーの onDoubleClick イベント時に実行する関数を指定します。                        |
| onClick            | (task: Task) => void                                                          | タスクバーの onClick イベント時に実行する関数を指定します。                              |
| onDelete\*         | (task: Task) => void/boolean/Promise<void>/Promise<boolean>                   | タスクバーの削除ボタン押下時に実行する関数を指定します。                                 |
| onDateChange\*     | (task: Task, children: Task[]) => void/boolean/Promise<void>/Promise<boolean> | タイムライン上でタスクバーをドラッグした後に実行する関数を指定します。                    |
| onProgressChange\* | (task: Task, children: Task[]) => void/boolean/Promise<void>/Promise<boolean> | タスクバーの進捗をドラッグした後に実行する関数を指定します。                             |
| onExpanderClick\*  | onExpanderClick: (task: Task) => void;                                        | テーブルの展開クリック時に実行する関数を指定します。                                     |
| onCellCommit       | (payload: CellCommitPayload) => Promise<void>                                 | セル編集を通知します。ホスト側で検証/保存し、タスクを更新して新しい props を渡すと UI が再描画されます。 |
| timeStep           | number                                                                        | onDateChange の時間ステップ値です。ミリ秒で指定します。                                  |

\* メソッドが false を返すかエラーの場合、チャートは操作を取り消します。パラメーター children は 1 階層分のレコードを返します。

### DisplayOption

| パラメーター名 | 型      | 説明                                                                                                         |
| :------------- | :------ | :---------------------------------------------------------------------------------------------------------- |
| viewMode       | enum    | 時間スケールを指定します。Hour, Quarter Day, Half Day, Day, Week(ISO-8601 で 1 日目は月曜), Month, QuarterYear, Year。 |
| viewDate       | date    | 表示に使用する日時を指定します。                                                                            |
| preStepsCount  | number  | 最初のタスクの前の空白を指定します。                                                                         |
| locale         | string  | 月名の言語を指定します。利用可能な形式: ISO 639-2, Java Locale。                                              |
| rtl            | boolean | rtl モードを設定します。                                                                                    |

### StylingOption

| パラメーター名             | 型     | 説明                                                                                           |
| :------------------------- | :----- | :--------------------------------------------------------------------------------------------- |
| headerHeight               | number | ヘッダーの高さを指定します。                                                                   |
| ganttHeight                | number | ヘッダーを除いたガントチャートの高さを指定します。既定は 0 で、高さ制限なしを意味します。        |
| columnWidth                | number | 時間期間の幅を指定します。                                                                     |
| listCellWidth              | string | タスクリストセルの幅を指定します。空文字列は「表示なし」を意味します。                           |
| rowHeight                  | number | タスク行の高さを指定します。                                                                   |
| barCornerRadius            | number | タスクバーの角丸を指定します。                                                                 |
| barFill                    | number | タスクバーの占有率を指定します。0〜100 のパーセントで設定します。                               |
| handleWidth                | number | 開始・終了日のドラッグ操作に使うタスクバーのハンドル幅を指定します。                             |
| fontFamily                 | string | アプリケーションのフォントを指定します。                                                       |
| fontSize                   | string | アプリケーションのフォントサイズを指定します。                                                 |
| barProgressColor           | string | タスクバーの進捗塗り色をグローバルに指定します。                                                 |
| barProgressSelectedColor   | string | 選択時のタスクバー進捗塗り色をグローバルに指定します。                                           |
| barBackgroundColor         | string | タスクバー背景の塗り色をグローバルに指定します。                                                 |
| barBackgroundSelectedColor | string | 選択時のタスクバー背景の塗り色をグローバルに指定します。                                         |
| arrowColor                 | string | 関係線の矢印の塗り色を指定します。                                                             |
| arrowIndent                | number | 関係線の矢印の右インデントを指定します。px で設定します。                                        |
| todayColor                 | string | 現在期間の列の塗り色を指定します。                                                             |
| TooltipContent             |        | 選択したタスクバー用の Tooltip ビューを指定します。                                              |
| TaskListHeader             |        | タスクリストの Header ビューを指定します。                                                     |
| TaskListTable              |        | タスクリストの Table ビューを指定します。                                                      |

- TooltipContent: [`React.FC<{ task: Task; fontSize: string; fontFamily: string; }>;`](https://github.com/MaTeMaTuK/gantt-task-react/blob/main/src/components/other/tooltip.tsx#L56)
- TaskListHeader: `React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string;}>;`
- TaskListTable: `React.FC<{ rowHeight: number; rowWidth: string; fontFamily: string; fontSize: string; locale: string; tasks: Task[]; selectedTaskId: string; setSelectedTask: (taskId: string) => void; }>;`

### Task

| パラメーター名 | 型       | 説明                                                                                                  |
| :------------- | :------- | :---------------------------------------------------------------------------------------------------- |
| id\*           | string   | タスク ID。                                                                                            |
| name\*         | string   | タスクの表示名。                                                                                        |
| type\*         | string   | タスクの表示タイプ: **task**, **milestone**, **project**                                               |
| start\*        | Date     | タスク開始日。                                                                                          |
| end\*          | Date     | タスク終了日。                                                                                          |
| progress\*     | number   | タスクの進捗。0〜100 のパーセントで設定します。                                                         |
| dependencies   | string[] | 親依存関係の ID を指定します。                                                                          |
| styles         | object   | タスクバーのローカルスタイル設定を指定します。次の属性を持つオブジェクトを渡します:                       |
|                |          | - **backgroundColor**: String。タスクバー背景の塗り色をローカルに指定します。                            |
|                |          | - **backgroundSelectedColor**: String。選択時のタスクバー背景の塗り色をローカルに指定します。            |
|                |          | - **progressColor**: String。タスクバー進捗の塗り色をローカルに指定します。                              |
|                |          | - **progressSelectedColor**: String。選択時のタスクバー進捗の塗り色をグローバルに指定します。             |
| isDisabled     | bool     | 現在のタスクの全操作を無効にします。                                                                    |
| fontSize       | string   | タスクバーのフォントサイズをローカルに指定します。                                                      |
| project        | string   | タスクのプロジェクト名                                                                                  |
| hideChildren   | bool     | 子要素を非表示にします。パラメーターは project タイプのときのみ有効です。                                |

\*必須

## ライセンス

[MIT](https://oss.ninja/mit/jaredpalmer/)
