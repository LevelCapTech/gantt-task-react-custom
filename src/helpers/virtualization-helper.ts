/**
 * 仮想化レンダリング用ヘルパー（純関数）
 *
 * plan §3.1: 範囲計算の定義
 *   仮想化無効: start=0, end=N
 *   仮想化有効かつN=0: start=end=viewStart=viewEnd=0
 *   maxScroll=max(0,N*rh-H); s=clamp(finite(scrollY)?scrollY:0,0,maxScroll)
 *   viewStart=floor(s/rh); viewEnd=min(N,ceil((s+H)/rh))
 *   start=max(0,viewStart-OVERSCAN_ROWS); end=min(N,viewEnd+OVERSCAN_ROWS)
 */

export const OVERSCAN_ROWS = 3;
export const PINNED_MAX = 4;

export type VisibleRange = {
  /** 描画開始行インデックス（含む） */
  start: number;
  /** 描画終了行インデックス（含まない） */
  end: number;
  /** 実viewport開始行インデックス（含む） */
  viewStart: number;
  /** 実viewport終了行インデックス（含まない） */
  viewEnd: number;
};

/**
 * 仮想化が有効な条件を判定する
 *
 * plan §1: enableVirtualization===true かつ ganttHeight>0 かつ rowHeight>0 のとき有効
 */
export const isVirtualizationEnabled = (
  enableVirtualization: boolean | undefined,
  ganttHeight: number,
  rowHeight: number
): boolean => {
  return (
    enableVirtualization === true &&
    Number.isFinite(ganttHeight) &&
    ganttHeight > 0 &&
    Number.isFinite(rowHeight) &&
    rowHeight > 0
  );
};

/**
 * 表示行の範囲を計算する純関数
 *
 * plan §3.1 の式をそのまま実装する。
 *
 * @param N         表示行配列の長さ
 * @param scrollY   現在の縦スクロール量 (px)
 * @param H         viewport の高さ (ganttHeight, px)
 * @param rh        1行の高さ (rowHeight, px)
 * @param enabled   仮想化が有効か
 */
export const computeVisibleRange = (
  N: number,
  scrollY: number,
  H: number,
  rh: number,
  enabled: boolean
): VisibleRange => {
  // 無効の場合は全行を返す
  if (!enabled) {
    return { start: 0, end: N, viewStart: 0, viewEnd: N };
  }

  // H または rh が非有限 / 0以下なら仮想化しない
  if (!Number.isFinite(H) || H <= 0 || !Number.isFinite(rh) || rh <= 0) {
    return { start: 0, end: N, viewStart: 0, viewEnd: N };
  }

  // N=0 は空
  if (N === 0) {
    return { start: 0, end: 0, viewStart: 0, viewEnd: 0 };
  }

  const maxScroll = Math.max(0, N * rh - H);

  // scrollY が負値・NaN・Infinity なら 0、上限超過なら maxScroll へ丸める
  const rawS = Number.isFinite(scrollY) ? scrollY : 0;
  const s = Math.max(0, Math.min(rawS, maxScroll));

  const viewStart = Math.floor(s / rh);
  const viewEnd = Math.min(N, Math.ceil((s + H) / rh));

  const start = Math.max(0, viewStart - OVERSCAN_ROWS);
  const end = Math.min(N, viewEnd + OVERSCAN_ROWS);

  return { start, end, viewStart, viewEnd };
};

/**
 * 描画行コンポーネント数の上限を返す
 *
 * plan §1: ceil(H/rh)+1+2*OVERSCAN_ROWS+PINNED_MAX
 */
export const maxRenderRows = (H: number, rh: number): number => {
  return Math.ceil(H / rh) + 1 + 2 * OVERSCAN_ROWS + PINNED_MAX;
};
