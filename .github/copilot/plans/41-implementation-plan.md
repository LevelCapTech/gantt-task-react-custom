# Implementation Plan: Task Table オーバーレイ型インプレース編集

## 1. 機能要件 / 非機能要件
- 機能要件:
  - Task Table（Task List）セルの Viewing / Selected / Editing 状態遷移を単一状態で管理する。
  - 編集開始トリガーは DoubleClick / Enter / 文字キーとし、単クリックは選択のみとする。
  - 編集中は単一エディタを Portal でセル上にオーバーレイ表示する。
  - Commit は `onCellCommit` の Promise を必須とし、resolve で閉じ、reject 時は編集継続＋エラー表示を行う。
  - Cancel は Escape / 値変更なし blur / DOM 消失（unmounted）で通知する。
  - Pending 中は再コミットやセル遷移を抑止する。
- 非機能要件:
  - 編集中のみ scroll/resize 監視を行い、性能劣化を防ぐ。
  - uncontrolled input を利用し、入力中の再レンダリングを抑える。
  - 値はログ出力せず、rowId/columnId/trigger のみを観測対象とする。
  - IME/Composition 入力を阻害せず、フォーカスと状態を破綻させない。
  - 公開 API の互換性を維持し、既存の閲覧 UX を壊さない。

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - `src/components/task-list/task-list.tsx`（選択/編集状態の管理）
  - `src/components/task-list/task-list-table.tsx`（セルイベントと編集トリガー）
  - `src/components/task-list/` 配下の新規 Overlay Editor（Portal）
  - `src/components/task-list/task-list-table.module.css`（オーバーレイ配置/エラー表示）
  - `src/types/public-types.ts`（公開 API と payload 型の追加）
- 影響範囲・互換性リスク:
  - Task Table のセル操作と編集 UX のみが対象。ガント本体のバー操作は対象外。
  - `onCellCommit` 未指定または `editable=false` の場合は従来通り閲覧専用とし、後方互換を維持する。
  - ガント本体（バー領域）のクリックは編集終了トリガーとして扱い、スクロール同期時はエディタ位置のみ追従する。
  - 公開 API の追加は任意 props とし、既存のシグネチャは変更しない。
- 外部依存・Secrets の扱い:
  - React Portal を利用し、新規依存は追加しない。
  - Commit の永続化と認証はホストアプリ責務とする。

## 3. 設計方針
- 責務分離 / データフロー:
  - State Owner は `TaskList`（テーブルルート）とし、`EditingState` を単一保持する。
```
// EditingState (conceptual)
// {
//   rowId: string | null
//   columnId: string | null
//   pending: boolean
//   trigger: 'dblclick' | 'enter' | 'key'
// }
```
  - `TaskListTable` はセルイベントを集約し、編集開始/終了の通知のみを行う。
  - セルは状態を持たず、data 属性で rowId/columnId を識別する。
  - Overlay Editor は Portal で 1 インスタンスのみ生成し、編集中セルの rect に追従する。
  - `onCellCommit` を await し、pending 中は UI 遷移を抑止する。
  - 公開 API 契約 / 拡張方針:
    - `onCellCommit` は必須で Promise を返す。未指定時は編集不可。
      - onCellCommit は値の検証・永続化・副作用を担う
      - Selected / Viewing などの UI 状態遷移は本コンポーネントの責務とする
    - `EditingState` は内部実装であり外部公開しない。外部から編集中セルを強制指定する API は提供しない。
    - Controlled Editing を許可する場合は破壊的変更になるため、新規 props で明示的に導入する（現時点では非対応）。
    - Tab/Shift+Tab は現時点で Commit + 移動を行わず、将来拡張候補とする。
    - 編集可否はすべて AND 条件で評価する。`editable` (table) が false なら常に不可、列/行の `editable` は前提条件として両方 true の場合のみ評価し、その上で `isCellEditable` を最終フィルタとして適用する（short-circuit せず最終結果で判定）。

```ts
editable =
  tableEditable &&
  columnEditable &&
  rowEditable &&
  isCellEditable(row, column);
```

 - 状態定義と遷移:
   - Viewing: `rowId/columnId=null`。選択枠なし。
   - Selected: `rowId/columnId` 保持、選択枠表示。編集は未開始。
   - Editing: overlay 表示、input focused。`pending` は commit 待ち制御に利用。
   - Viewing → Selected: 単クリック/矢印移動で対象セルを選択。
   - Selected → Editing: DoubleClick / Enter / 文字キー（プリント可能）で遷移。
    - Selected → Viewing: デフォルトは選択維持とし、テーブル外クリックでは解除しない。Esc は Selected 中は no-op とし、将来拡張候補とする。
      - Esc は Editing 専用の操作であり、Selected では意味を持たない
   - Editing → Selected: Commit resolve / Cancel（Escape, nochange-blur）。
   - Editing → Viewing: DOM 消失で Cancel（reason=unmounted）し選択解除。
   - 禁止遷移: pending 中の Selected 変更、Editing 再入、再 Commit。
  - 入力制御 / キーボード:
    - 文字キー対象: `event.key.length === 1` かつ `!meta/ctrl/alt`。英数/記号/Space を含む。
    - 想定外キーは無視する前提とし、編集開始トリガーにしない。
    - IME: `compositionstart` または `key === 'Process'` で Editing 開始し、既存値はクリアして IME 入力を許可。
    - composition 中の blur は Commit/Cancel を発火せず、編集を継続する。
    - 文字キー開始時は既存値を置換する（Excel/Sheets 同様）。
    - Editing 中の Enter は Commit、Escape は Cancel（pending 中は無効）。
    - Editing 中の矢印/Tab はセル移動を行わず input 操作を優先する。
  - フォーカス / 優先順位:
   - Editing 開始時は input に focus、Selected 状態はセル root に focus を戻す。
   - Editing 中の click は「現在セル Commit → resolve 後にクリック先セルを Selected」。
    - pending 中の click / Enter / Escape は無効化し、入力欄は readOnly を優先して focus を維持する。keydown はガードし、入力変更は受け付けない。
      - pending 中は value 変更系イベント（input/change）も無視する
    - pending 中は軽量な視覚フィードバック（例: opacity 変更やインライン表示）を出す。
    - Cancel 後は元セル Selected を維持し、unmounted ではテーブル root に戻す。
  - A11y:
    - Selected セルのみ `tabIndex=0`、非 Selected セルは `tabIndex=-1` を基本とする。
      - tabIndex の切り替えは Selected 変更時にのみ行い、再レンダリングを最小化する
    - Selected セルは confirmation focusable（例: `aria-selected=true`）。
    - Editor input は `role="textbox"` を持ち、`aria-label` で列名を示す。
    - キーボード操作前提 UI である旨をドキュメントで明示する。
    - Tab 移動はテーブル外のフォーカス遷移を優先し、セル間移動は矢印キー前提とする。
- エッジケース / 例外系 / リトライ方針:
  - 値変更なし blur は Cancel（reason=nochange-blur）として通知する。
  - Commit reject は Editing 継続＋エラー表示とし、Enter で再試行できる。
  - 編集中に対象セル DOM が消失した場合は短い猶予（1-2 frame）で再検出し、復帰できなければ Cancel（reason=unmounted）。
  - composition 中であっても DOM 消失は unmounted を優先し Cancel する。
- ログと観測性（漏洩防止を含む）:
  - rowId/columnId/trigger/reason をデバッグログに残す。
  - 入力値・トークン・PII はログに含めない。
  - Portal 配置 / rect 追従:
   - scroll/resize は capture で監視し、`requestAnimationFrame` で 1frame に集約する。
     - rect 再計算は requestAnimationFrame 内で 1 回のみ行う
   - Task Table とガント本体の同期スクロール時も rect を再計算する。
   - `getBoundingClientRect()` を使い、`Math.round` でサブピクセル揺れを抑える。
   - `ResizeObserver` が利用可能ならセル/テーブルのサイズ変化を監視する。
   - スクロールコンテナは Task Table の縦スクロール要素と、ガント本体と共有する横スクロール要素を対象とする。
   - window スクロールが有効なレイアウトでは window も監視対象に含める。
   - ネストしたスクロール要素がある場合は最も近い scrollable ancestor を優先し、明示指定があればそれを優先する。
   - 親子で同時にスクロールする場合は最後に発火したイベントで rect を確定する。
   - scroll/resize が同一 frame 内で発生した場合も、最後に計算した rect を採用する。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常系: Enter/dblclick/キー入力で Editing 開始、Commit resolve で閉じる。
  - 例外系: Commit reject で編集継続＋エラー表示、Escape で Cancel。
  - 境界: 値変更なし blur は Commit されない。
  - DOM 消失時に Cancel（reason=unmounted）される。
  - Pending 中に Enter 連打しても再 Commit しない。
  - Pending 中の別セルクリックは無視される。
  - Editing 中にスクロールして rect が再計算される。
  - IME composition 開始で Editing に遷移し入力が保持される。
  - 回帰条件: 単クリックで編集開始しない / Enter なしで commit しない / ガント本体操作を阻害しない。
  - 非機能回帰（セル再マウント検知など）は自動テストが難しいため、設計レビュー時に手動チェック項目として残す。
  - 設計レビュー手動チェック（必須）:
    - 単クリックで Editing に入らない。
    - pending 中の操作が無効化される。
    - Portal の rect がスクロールで追従する。
    - DOM 消失時に editor が残留しない。
    - Editing 中にセルが再マウントされない。
- モック / フィクスチャ方針:
  - `onCellCommit` を Promise でモックし、resolve/reject を切り替える。
- テスト追加の実行コマンド（例: `python -m pytest`）:
  - `npm run test:unit`

## 5. CI 品質ゲート
- 実行コマンド（format / lint / typecheck / test / security）:
  - `npm run test:lint`
  - `npm run test:unit`
  - `npm run test:build`
- 通過基準と失敗時の対応:
  - 既存の lint/test/build を全てパスすること。失敗時は該当箇所のみ修正する。

## 6. ロールアウト・運用
- ロールバック方法:
  - `editable=false` または `onCellCommit` 未指定で従来表示に戻せるようにする。
- 監視・運用上の注意:
  - 実装フェーズでは Commit 失敗時の UI がユーザー操作を阻害しないことを確認する。
  - 設計レビュー手動チェックは PR レビュー時に必ず確認し、将来 CONTRIBUTING/PR テンプレへ転記する。

## 7. オープンな課題 / ADR 要否
- 未確定事項:
  - Portal のルート要素（`document.body` か専用 root）の標準化。
  - エラー表示の UI 形式（tooltip かインラインメッセージ）。
  - 仮想化は現時点で公式サポート外とし、導入時は ADR で方針を確定する。
  - 仮想化環境では editor が閉じる、スクロール時に一時的にズレる可能性がある。
  - Quick Spec（README に短縮版仕様）を別途用意するか検討する。
    - Click: 選択
    - Enter / DoubleClick: 編集開始
    - Esc: キャンセル
    - Blur: 条件付きキャンセル
  - README/Quick Spec では「仮想化環境の編集 UX は保証しない」「editor が閉じる/ズレるのは仕様」と明記する。
    - 仮想化環境では編集 UX は保証しない
    - editor が閉じる／ズレる挙動は仕様である
- ADR に残すべき判断:
  - 仮想化導入時の DOM 消失扱いを正式に決定する場合は ADR に残す。
