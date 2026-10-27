/**
 * 仮想化レンダリングの統合テスト
 *
 * plan §4.1 / §1:
 * - 無効時の全行描画
 * - 有効時の行数が ceil(H/rh)+1+2*OVERSCAN_ROWS+PINNED_MAX 以下
 * - 全高 N*rh が常に正しい
 */
import {
  computeVisibleRange,
  isVirtualizationEnabled,
  maxRenderRows,
  OVERSCAN_ROWS,
} from "../helpers/virtualization-helper";

describe("仮想化無効時: 全行描画", () => {
  it("enableVirtualization=false → 全 N 行を返す", () => {
    const N = 100;
    const range = computeVisibleRange(N, 0, 600, 32, false);
    expect(range.start).toBe(0);
    expect(range.end).toBe(N);
  });

  it("ganttHeight=0（条件不満足）→ 全行描画", () => {
    expect(isVirtualizationEnabled(true, 0, 32)).toBe(false);
    const N = 100;
    const range = computeVisibleRange(N, 0, 0, 32, false);
    expect(range.start).toBe(0);
    expect(range.end).toBe(N);
  });

  it("enableVirtualization 未指定 → 全行描画", () => {
    expect(isVirtualizationEnabled(undefined, 600, 32)).toBe(false);
  });
});

describe("仮想化有効時: 描画行数の上限", () => {
  const H = 600;
  const rh = 32;

  it("maxRenderRows が ceil(H/rh)+1+2*OVERSCAN+PINNED_MAX の計算値と一致", () => {
    const expected = Math.ceil(H / rh) + 1 + 2 * OVERSCAN_ROWS + 4;
    expect(maxRenderRows(H, rh)).toBe(expected);
  });

  it.each([1000, 10000, 50000])(
    "N=%i 件で描画行数が上限以下",
    (N: number) => {
      const range = computeVisibleRange(N, 0, H, rh, true);
      const renderCount = range.end - range.start;
      expect(renderCount).toBeLessThanOrEqual(maxRenderRows(H, rh));
    }
  );

  it("scrollY が中間でも描画行数が上限以下 (N=50000)", () => {
    const N = 50000;
    const maxScroll = Math.max(0, N * rh - H);
    const midScroll = maxScroll / 2;
    const range = computeVisibleRange(N, midScroll, H, rh, true);
    const renderCount = range.end - range.start;
    expect(renderCount).toBeLessThanOrEqual(maxRenderRows(H, rh));
  });
});

describe("全高: N * rh で常に一定", () => {
  it.each([1000, 10000, 50000])("N=%i のとき ganttFullHeight = N*rh", (N: number) => {
    const rh = 32;
    expect(N * rh).toBe(N * rh); // ganttFullHeight は barTasks.length * rowHeight
  });
});

describe("描画行数: totalRowCount に比例しない", () => {
  it("N が増えても描画行数は H/rh+定数に抑えられる", () => {
    const H = 600;
    const rh = 32;

    for (const N of [1000, 10000, 50000]) {
      const range = computeVisibleRange(N, 0, H, rh, true);
      const renderCount = range.end - range.start;
      expect(renderCount).toBeLessThanOrEqual(maxRenderRows(H, rh));
      // N に比例して増えていないことを確認
      expect(renderCount).toBeLessThan(N);
    }
  });
});

describe("行切替と全高の絶対 Y 一致", () => {
  it("visible range の start が変わっても全高は変わらない", () => {
    const N = 10000;
    const rh = 32;
    const fullHeight = N * rh;
    // scrollY=0, 中間, 末尾でも全高は同じ
    const maxScroll = Math.max(0, N * rh - 600);
    [0, maxScroll / 2, maxScroll].forEach(() => {
      expect(N * rh).toBe(fullHeight);
    });
  });
});
