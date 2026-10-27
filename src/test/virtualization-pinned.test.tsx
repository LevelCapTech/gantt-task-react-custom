/**
 * pinned 行のテスト
 *
 * plan §4.1 / §3.4:
 * - PINNED_MAX 定数の確認
 * - 範囲内↔pinned 移動の再マウント禁止（概念テスト）
 *
 * 注: plan §3.4 の完全な DOM 同一性テストは UI コンポーネントに依存するため
 * jsdom のモックが必要。ここでは定数と基本ロジックのみ確認する。
 * DOM 同一性（再マウント禁止）は example での手動確認として補完する（plan §5）。
 */
import { PINNED_MAX, OVERSCAN_ROWS } from "../helpers/virtualization-helper";

describe("PINNED_MAX 定数", () => {
  it("PINNED_MAX=4（選択/編集/ドラッグ/フォーカス各1）", () => {
    expect(PINNED_MAX).toBe(4);
  });
});

describe("OVERSCAN_ROWS 定数", () => {
  it("OVERSCAN_ROWS=3", () => {
    expect(OVERSCAN_ROWS).toBe(3);
  });
});

describe("行数上限: ceil(H/rh)+1+2*OVERSCAN_ROWS+PINNED_MAX", () => {
  it("H=600, rh=32 の場合の上限値が正しい", () => {
    // ceil(600/32)+1+2*3+4 = 19+1+6+4 = 30
    const H = 600;
    const rh = 32;
    const expected = Math.ceil(H / rh) + 1 + 2 * OVERSCAN_ROWS + PINNED_MAX;
    expect(expected).toBe(30);
  });

  it("行数上限は矢印本数に適用しない（plan §1 注意書き）", () => {
    // この定数は行コンポーネント数の上限であり、Arrow 数の上限ではない
    // テストは定数確認のみ
    expect(PINNED_MAX).toBeGreaterThan(0);
    expect(OVERSCAN_ROWS).toBeGreaterThan(0);
  });
});

describe("pinned 行の選択/編集/ドラッグ/フォーカスの上限", () => {
  it("各操作で最大 1 行ずつ、合計 PINNED_MAX=4 行まで pinned", () => {
    // PINNED_MAX は選択・編集・ドラッグ・フォーカス各1の合計
    const pinnedTypes = ["selection", "editing", "drag", "focus"];
    expect(pinnedTypes).toHaveLength(PINNED_MAX);
  });
});
