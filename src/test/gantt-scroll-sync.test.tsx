/**
 * スクロール同期のテスト
 *
 * plan §4.1 / §3.2:
 * - scrollY の範囲計算との整合
 * - 先頭/末尾のスクロール境界
 */
import {
  computeVisibleRange,
  isVirtualizationEnabled,
} from "../helpers/virtualization-helper";

describe("スクロール同期: 先頭/末尾境界", () => {
  const rh = 32;
  const H = 600;
  const N = 1000;
  const maxScroll = Math.max(0, N * rh - H);

  it("scrollY=0 → viewStart=0", () => {
    const r = computeVisibleRange(N, 0, H, rh, true);
    expect(r.viewStart).toBe(0);
  });

  it("scrollY=maxScroll → viewEnd=N", () => {
    const r = computeVisibleRange(N, maxScroll, H, rh, true);
    expect(r.viewEnd).toBe(N);
  });

  it("scrollY > maxScroll → maxScroll に丸める（viewEnd=N）", () => {
    const r = computeVisibleRange(N, maxScroll + 1000, H, rh, true);
    expect(r.viewEnd).toBe(N);
  });

  it("scrollY=0 の start=0（下限クランプ）", () => {
    const r = computeVisibleRange(N, 0, H, rh, true);
    expect(r.start).toBe(0); // max(0, 0-OVERSCAN_ROWS) = 0
  });

  it("scrollY=maxScroll の end=N（上限クランプ）", () => {
    const r = computeVisibleRange(N, maxScroll, H, rh, true);
    expect(r.end).toBe(N);
  });
});

describe("スクロール同期: 同値イベントのループ防止", () => {
  it("同じ scrollY では viewStart/viewEnd が変わらない", () => {
    const r1 = computeVisibleRange(1000, 300, 600, 32, true);
    const r2 = computeVisibleRange(1000, 300, 600, 32, true);
    expect(r1).toEqual(r2);
  });

  it("viewport 変化がなければ範囲も変わらない", () => {
    // scrollY が 1px 変わっても viewport 行が変わらない場合は start/end も同じ
    const r1 = computeVisibleRange(1000, 64, 600, 32, true);
    const r2 = computeVisibleRange(1000, 65, 600, 32, true);
    // floor(64/32)=2, floor(65/32)=2 → viewStart 同じ
    expect(r1.viewStart).toBe(r2.viewStart);
  });
});

describe("仮想化無効時: isVirtualizationEnabled=false での範囲", () => {
  it("ganttHeight>0 でも enableVirtualization=false なら全行", () => {
    expect(isVirtualizationEnabled(false, 600, 32)).toBe(false);
    const r = computeVisibleRange(1000, 100, 600, 32, false);
    expect(r.start).toBe(0);
    expect(r.end).toBe(1000);
  });
});
