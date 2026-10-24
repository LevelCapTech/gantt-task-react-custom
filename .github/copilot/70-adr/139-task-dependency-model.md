# ADR: タスク依存関係モデルの拡張
- Status: Accepted
- Date: 2026-10-24

## Context
- 既存の `Task.dependencies?: string[]` は FS 固定・lag なしの表現しかできず、SS/FF/SF や lead/lag を扱えない。
- 公開API互換を維持したまま依存メタデータを保持し、描画・折りたたみ・編集コールバックで同じ依存解釈を使う必要がある。
- 循環入力や存在しないIDが混在してもクラッシュさせず、描画継続できる fail-safe が必要である。

## Decision
- 公開型に `dependencyLinks?: TaskDependencyLink[]` を追加し、`DependencyType = "FS" | "SS" | "FF" | "SF"` を採用する。
- `dependencies` と `dependencyLinks` は共存可能とし、同一先行タスクIDでは `dependencyLinks` を優先する。
- 依存は `NormalizedDependency[]`（`fromId` / `toId` / `type` / `lagMinutes` / `source`）へ正規化する。`lag` の単位は minute 固定とし、描画の見た目差分にのみ使う。
- 循環は描画前の全件検査・事前除外を行わず、再帰処理（折りたたみ/children探索）で `visited` / `inStack` により再訪問を停止する。
- 存在しないID・破損依存は描画不能依存として除外し、公開通知コールバック・公開診断APIは追加しない。

## Consequences
- 既存 `dependencies` 利用者は互換を維持したまま従来表示を継続できる。
- `dependencyLinks` により FS/SS/FF/SF と正負lagを保持でき、将来の自動スケジューリング/CPM拡張の前提データを確保できる。
- lag は日程自動調整に使わないため、利用者には「制約エンジンではなく見た目の時間差」であることをREADME/exampleで明示する必要がある。
- 循環は事前除外しないため依存データの原形を保てる一方、再帰処理側の停止制御を常に維持する必要がある。

## Alternatives Considered
- 代替案1: 循環を描画前の全件DFSで検出し、循環エッジを事前除外する。
  - 不採用理由: 通常描画コスト増加と、循環を理由に矢印を消す仕様がplan最新方針と矛盾するため。
- 代替案2: lag を稼働日換算し日程へ自動反映する。
  - 不採用理由: 今回スコープ外であり、公開挙動の破壊的変更を招くため。
- 代替案3: 公開通知コールバック/公開診断APIを同時追加する。
  - 不採用理由: 契約が重くなり、planで今回非対応と明示されているため。

## References
- Design Issue: https://github.com/LevelCapTech/gantt-task-react-custom/issues/139
- Design PR: https://github.com/LevelCapTech/gantt-task-react-custom/pull/145
- Plan: ../plans/139-task-dependency-model.md
- Implement Issue: https://github.com/LevelCapTech/gantt-task-react-custom/issues/146
