/**
 * virtualization-helper の範囲計算テスト
 *
 * plan §4.1 / §3.1 の仕様を網羅する
 */
import {
  computeVisibleRange,
  isVirtualizationEnabled,
  OVERSCAN_ROWS,
} from "../helpers/virtualization-helper";

describe("isVirtualizationEnabled", () => {
  it("trueのとき: enableVirtualization=true, ganttHeight>0, rowHeight>0 → true", () => {
    expect(isVirtualizationEnabled(true, 600, 32)).toBe(true);
  });
  it("enableVirtualization=falseなら false", () => {
    expect(isVirtualizationEnabled(false, 600, 32)).toBe(false);
  });
  it("enableVirtualization=undefinedなら false", () => {
    expect(isVirtualizationEnabled(undefined, 600, 32)).toBe(false);
  });
  it("ganttHeight=0なら false", () => {
    expect(isVirtualizationEnabled(true, 0, 32)).toBe(false);
  });
  it("ganttHeight<0なら false", () => {
    expect(isVirtualizationEnabled(true, -1, 32)).toBe(false);
  });
  it("rowHeight=0なら false", () => {
    expect(isVirtualizationEnabled(true, 600, 0)).toBe(false);
  });
  it("ganttHeight=Infinityなら false", () => {
    expect(isVirtualizationEnabled(true, Infinity, 32)).toBe(false);
  });
  it("rowHeight=NaNなら false", () => {
    expect(isVirtualizationEnabled(true, 600, NaN)).toBe(false);
  });
});

describe("computeVisibleRange", () => {
  const rh = 32;
  const H = 96; // 3行分
  const N = 100;

  describe("無効時（enabled=false）", () => {
    it("start=0, end=N を返す", () => {
      const r = computeVisibleRange(N, 0, H, rh, false);
      expect(r).toEqual({ start: 0, end: N, viewStart: 0, viewEnd: N });
    });
  });

  describe("有効時 (rh=32, H=96, N=100)", () => {
    it("scrollY=0 → viewport [0,3), 描画 [0,6)", () => {
      const r = computeVisibleRange(N, 0, H, rh, true);
      expect(r.viewStart).toBe(0);
      expect(r.viewEnd).toBe(3);
      expect(r.start).toBe(0);
      expect(r.end).toBe(3 + OVERSCAN_ROWS);
    });

    it("scrollY=64 → viewport [2,5), 描画 [0,8)", () => {
      const r = computeVisibleRange(N, 64, H, rh, true);
      expect(r.viewStart).toBe(2);
      expect(r.viewEnd).toBe(5);
      expect(r.start).toBe(0); // max(0, 2-3)
      expect(r.end).toBe(8); // min(100, 5+3)
    });

    it("scrollY=48 → viewport [1,5), 描画 [0,8)", () => {
      // scrollY=48: floor(48/32)=1, ceil((48+96)/32)=ceil(144/32)=ceil(4.5)=5
      const r = computeVisibleRange(N, 48, H, rh, true);
      expect(r.viewStart).toBe(1);
      expect(r.viewEnd).toBe(5);
      expect(r.start).toBe(0);
      expect(r.end).toBe(8);
    });

    it("下端 scrollY → viewport [97,100), 描画 [94,100)", () => {
      const maxScroll = N * rh - H; // 100*32-96=3104
      const r = computeVisibleRange(N, maxScroll, H, rh, true);
      expect(r.viewStart).toBe(97);
      expect(r.viewEnd).toBe(100);
      expect(r.start).toBe(97 - OVERSCAN_ROWS); // 94
      expect(r.end).toBe(100);
    });
  });

  describe("空配列 N=0", () => {
    it("すべて 0 を返す", () => {
      const r = computeVisibleRange(0, 0, H, rh, true);
      expect(r).toEqual({ start: 0, end: 0, viewStart: 0, viewEnd: 0 });
    });
  });

  describe("短い配列 (N < ceil(H/rh))", () => {
    it("N=2, H=96, rh=32 → 全行描画", () => {
      const r = computeVisibleRange(2, 0, H, rh, true);
      expect(r.start).toBe(0);
      expect(r.end).toBe(2);
      expect(r.viewStart).toBe(0);
      expect(r.viewEnd).toBe(2);
    });
  });

  describe("不正な scrollY", () => {
    it("scrollY=NaN → 0 として扱う", () => {
      const r = computeVisibleRange(N, NaN, H, rh, true);
      expect(r.viewStart).toBe(0);
    });
    it("scrollY=Infinity → 0 として扱う（plan §3.1）", () => {
      const r = computeVisibleRange(N, Infinity, H, rh, true);
      expect(r.viewStart).toBe(0);
    });
    it("scrollY=-100 → 0 として扱う", () => {
      const r = computeVisibleRange(N, -100, H, rh, true);
      expect(r.viewStart).toBe(0);
    });
    it("scrollY > maxScroll → maxScroll として扱う", () => {
      const r = computeVisibleRange(N, 999999, H, rh, true);
      expect(r.viewEnd).toBe(N);
    });
  });

  describe("不正な H または rh", () => {
    it("H=0 → 仮想化しない", () => {
      const r = computeVisibleRange(N, 0, 0, rh, true);
      expect(r).toEqual({ start: 0, end: N, viewStart: 0, viewEnd: N });
    });
    it("H=NaN → 仮想化しない", () => {
      const r = computeVisibleRange(N, 0, NaN, rh, true);
      expect(r).toEqual({ start: 0, end: N, viewStart: 0, viewEnd: N });
    });
    it("rh=0 → 仮想化しない", () => {
      const r = computeVisibleRange(N, 0, H, 0, true);
      expect(r).toEqual({ start: 0, end: N, viewStart: 0, viewEnd: N });
    });
    it("rh=-1 → 仮想化しない", () => {
      const r = computeVisibleRange(N, 0, H, -1, true);
      expect(r).toEqual({ start: 0, end: N, viewStart: 0, viewEnd: N });
    });
  });

  describe("opt-in の全組合せ", () => {
    const cases: Array<[boolean | undefined, boolean, number, number, boolean]> =
      [
        [true, true, 600, 32, true],
        [false, true, 600, 32, false],
        [undefined, true, 600, 32, false],
        [true, false, 0, 32, false],
        [true, false, 600, 0, false],
      ];
    cases.forEach(([ev, _enabled, gh, rh2, expected]) => {
      it(`enableVirtualization=${ev}, ganttHeight=${gh}, rowHeight=${rh2} → ${expected}`, () => {
        expect(isVirtualizationEnabled(ev, gh, rh2)).toBe(expected);
      });
    });
  });
});
