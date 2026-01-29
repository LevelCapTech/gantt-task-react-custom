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

## 2. スコープと変更対象
- 変更ファイル（新規/修正/削除）:
  - `src/components/task-list/task-list.tsx`（選択/編集状態の管理）
  - `src/components/task-list/task-list-table.tsx`（セルイベントと編集トリガー）
  - `src/components/task-list/` 配下の新規 Overlay Editor（Portal）
  - `src/components/task-list/task-list-table.module.css`（オーバーレイ配置/エラー表示）
  - `src/types/public-types.ts`（公開 API と payload 型の追加）
- 影響範囲・互換性リスク:
  - Task Table のセル操作と編集 UX のみが対象。ガント本体のバー操作は対象外。
  - 追加 props は任意として後方互換を維持する。
- 外部依存・Secrets の扱い:
  - React Portal を利用し、新規依存は追加しない。
  - Commit の永続化と認証はホストアプリ責務とする。

## 3. 設計方針
- 責務分離 / データフロー:
  - Task Table 内で単一の `EditingState` を保持し、Selected/Editing を制御する。
  - Overlay Editor は Portal で 1 インスタンスのみ生成し、編集対象セルの rect に追従する。
  - `onCellCommit` を await し、pending 中は UI 遷移を抑止する。
- エッジケース / 例外系 / リトライ方針:
  - 値変更なし blur は Cancel（reason=nochange-blur）として通知する。
  - Commit reject は Editing 継続＋エラー表示とし、Enter で再試行できる。
  - 編集中に対象セル DOM が消失した場合は Cancel（reason=unmounted）し、エディタを閉じる。
- ログと観測性（漏洩防止を含む）:
  - rowId/columnId/trigger/reason をデバッグログに残す。
  - 入力値・トークン・PII はログに含めない。

## 4. テスト戦略
- テスト観点（正常 / 例外 / 境界 / 回帰）:
  - 正常系: Enter/dblclick/キー入力で Editing 開始、Commit resolve で閉じる。
  - 例外系: Commit reject で編集継続＋エラー表示、Escape で Cancel。
  - 境界: 値変更なし blur は Commit されない。
  - DOM 消失時に Cancel（reason=unmounted）される。
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
  - 変更は plan ドキュメントのみのため、該当ファイルの差分を revert する。
- 監視・運用上の注意:
  - 実装フェーズでは Commit 失敗時の UI がユーザー操作を阻害しないことを確認する。

## 7. オープンな課題 / ADR 要否
- 未確定事項:
  - Portal のルート要素（`document.body` か専用 root）の標準化。
  - エラー表示の UI 形式（tooltip かインラインメッセージ）。
- ADR に残すべき判断:
  - 仮想化導入時の DOM 消失扱いを正式に決定する場合は ADR に残す。
