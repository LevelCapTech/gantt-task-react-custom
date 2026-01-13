# 調査結果: DESIGN → IMPLEMENT 間の plan 保存/参照構造

本ドキュメントは [RESEARCH] Issue における DESIGN→IMPLEMENT ハンドオフの調査結果をまとめたものです。仕様の入口は [00-index.md](../00-index.md) を参照してください。

## 1. 事実と根拠
- plan作成は [00-index.md](../00-index.md) と [20-architecture.md](../20-architecture.md) で Phase A（DESIGN）として明示され、出力テンプレートは [implementation-plan.md](../80-templates/implementation-plan.md) に固定されている。
- IMPLEMENT Issue の入力は `.github/copilot/plans/<issue-number>-implementation-plan.md` をリポジトリルートからの相対パスで固定する運用が [README の「4.3 [IMPLEMENT] 実装 Issue」テンプレート](../../../README.md)で求められている。
- 現状 `.github/copilot/plans/` ディレクトリや `*implementation-plan*.md` ファイルは存在せず、生成は自動化されていない。
- `copilot/plans` を参照するコードや Workflow 定義は存在せず、plan 保存は手動運用前提となっている。

## 2. 原因仮説の切り分け結果
- DESIGN完了時に手動で `.github/copilot/plans/<issue-number>-implementation-plan.md` を作成・保存する運用を想定しているが、ディレクトリ未作成のため実体がなく、IMPLEMENT Issue で指定したパスがファイル未検出エラーになるリスクがある。
- 命名規則（`<issue-number>-implementation-plan.md`）が README 上の記述に依存しており、ヒューマンエラーによる取り違え・置き場所不一致が起きやすい。

## 3. 選択肢（Pros/Cons）と推奨案
- **手動運用を明示する**: DESIGN手順のチェックリストに「`.github/copilot/plans/` を作成し、`<issue-number>-implementation-plan.md` を配置する」という項目を追記するだけで済む。追加開発なし。ただし人的ミスは残る。
- **スクリプト/Workflowでplanを生成する（推奨）**: Issue 番号を入力すると `.github/copilot/plans/<issue-number>-implementation-plan.md` をテンプレートから生成する簡易スクリプトを用意する、または Issue Template 連動 Workflow で自動生成する。命名・配置を強制できるため、人的ミス削減と運用一貫性に有効。

## 4. 次アクション
- **起票**: `[DESIGN] plan の保存と参照の統一化` を新規 Issue として起票する。起票責任: リポジトリ OWNER（LevelCapTech）。期限目安: 本PRマージ後 1 週間以内。
- **スコープ**: `.github/copilot/plans/` ディレクトリの常設、`<issue-number>-implementation-plan.md` 命名規則の固定、生成フロー（手動チェックリスト強化またはスクリプト/Action自動化）の決定。
- **SSOT反映**: 決定したルールを `.github/copilot/` 配下の SSOT ドキュメント（該当する場合は [20-architecture.md](../20-architecture.md) か [10-requirements.md](../10-requirements.md)）へ反映し、README は要約リンクにとどめる。
