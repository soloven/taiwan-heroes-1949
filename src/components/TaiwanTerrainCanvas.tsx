import { useMemo } from 'react';
import type { DistrictId } from '../types/game';
import {
  MAINLAND_COAST_PATH,
  TAIWAN_MAIN_SILHOUETTE_PATH,
  TAIWAN_MAP_GEOMETRIES,
  TAIWAN_MAP_RENDER_ORDER,
  TAIWAN_MAP_VIEWBOX,
} from '../data/taiwanMapPaths';

const W = TAIWAN_MAP_VIEWBOX.width; // 860
const H = TAIWAN_MAP_VIEWBOX.height; // 860
const SCALE = 2; // 1720 x 1720 crisp high-DPI painterly terrain canvas

const OUTLYING_ISLANDS = new Set<DistrictId>(['lienchiang', 'kinmen', 'penghu']);

// Deterministic hash table for smooth value noise (zero allocations in hot loop)
const PERM = new Uint8Array(512);
const VALS = new Float32Array(256);
(() => {
  let seed = 13374209;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    p[i] = i;
    VALS[i] = nextRand();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255];
  }
})();

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = xi & 255;
  const y0 = yi & 255;
  const x1 = (x0 + 1) & 255;
  const y1 = (y0 + 1) & 255;

  const aa = VALS[PERM[PERM[x0] + y0]];
  const ba = VALS[PERM[PERM[x1] + y0]];
  const ab = VALS[PERM[PERM[x0] + y1]];
  const bb = VALS[PERM[PERM[x1] + y1]];

  const nx0 = aa + u * (ba - aa);
  const nx1 = ab + u * (bb - ab);
  return nx0 + v * (nx1 - nx0);
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * vnoise(x * freq, y * freq);
    norm += amp;
    freq *= 2.02;
    amp *= 0.5;
  }
  return value / norm;
}

function ridgedFbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.55;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = vnoise(x * freq, y * freq);
    const ridge = 1 - Math.abs(n * 2 - 1);
    value += amp * ridge * ridge;
    norm += amp;
    freq *= 2.04;
    amp *= 0.5;
  }
  return value / norm;
}

interface RidgeSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  weight: number;
  width: number;
}

function buildPolylineSegments(
  pts: Array<[number, number]>,
  weight: number,
  width: number
): RidgeSegment[] {
  const segs: RidgeSegment[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segs.push({
      ax: pts[i][0],
      ay: pts[i][1],
      bx: pts[i + 1][0],
      by: pts[i + 1][1],
      weight,
      width,
    });
  }
  return segs;
}

// Authentic Taiwan mountain spines in 860x860 map coordinates (shifted +30 on X)
const TAIWAN_RIDGE_SEGMENTS: RidgeSegment[] = [
  // Central Mountain Range (中央山脈): Nanhu -> Hehuan -> Nenggao -> Guanshan -> Dawushan
  ...buildPolylineSegments(
    [
      [748, 164],
      [724, 226],
      [701, 294],
      [684, 372],
      [659, 458],
      [633, 544],
      [614, 632],
      [602, 704],
      [596, 760],
    ],
    0.86,
    43
  ),
  // Xueshan Range (雪山山脈)
  ...buildPolylineSegments(
    [
      [753, 140],
      [721, 192],
      [690, 244],
      [666, 300],
    ],
    0.68,
    33
  ),
  // Yushan & Alishan Range (玉山與阿里山脈)
  ...buildPolylineSegments(
    [
      [659, 458],
      [630, 466],
      [602, 496],
      [579, 532],
    ],
    0.72,
    31
  ),
  // East Coastal Range (海岸山脈)
  ...buildPolylineSegments(
    [
      [737, 334],
      [724, 404],
      [708, 474],
      [686, 534],
    ],
    0.48,
    19
  ),
];

// Iconic peaks for sculptural 3D topographic relief (860x860 coordinates)
const TAIWAN_PEAKS: Array<{ x: number; y: number; h: number; r: number }> = [
  { x: 639, y: 460, h: 0.48, r: 30 }, // 玉山主峰 (Yushan)
  { x: 688, y: 244, h: 0.42, r: 28 }, // 雪山 (Xueshan)
  { x: 695, y: 312, h: 0.36, r: 28 }, // 合歡山 / 奇萊
  { x: 730, y: 196, h: 0.32, r: 26 }, // 南湖大山
  { x: 626, y: 546, h: 0.32, r: 26 }, // 關山
  { x: 611, y: 636, h: 0.30, r: 26 }, // 北大武山
  { x: 732, y: 96, h: 0.22, r: 18 }, // 大屯火山群 (Yangmingshan)
];

// Fertile golden plains & basins (860x860 coordinates)
const TAIWAN_PLAINS: Array<{ x: number; y: number; depth: number; rx: number; ry: number }> = [
  { x: 724, y: 122, depth: 0.24, rx: 22, ry: 20 }, // 台北盆地
  { x: 757, y: 210, depth: 0.26, rx: 22, ry: 22 }, // 蘭陽平原
  { x: 599, y: 292, depth: 0.19, rx: 32, ry: 28 }, // 台中盆地
  { x: 526, y: 445, depth: 0.27, rx: 56, ry: 118 }, // 嘉南平原 & 彰雲平原
  { x: 560, y: 668, depth: 0.24, rx: 34, ry: 54 }, // 屏東平原
  { x: 708, y: 424, depth: 0.18, rx: 11, ry: 72 }, // 花東縱谷
];

// Sculpted hand-painted 3D faceted alpine peaks along Taiwan's mountain spines (style05.jpg look)
interface FacetedPeak {
  x: number;
  y: number;
  w: number;
  h: number;
  snow: number; // 0..1 ridge ivory-snow intensity
  lean: number; // ridge offset
}

const SCULPTED_ALPINE_PEAKS: FacetedPeak[] = [
  // Yangmingshan / Northern Hills
  { x: 733, y: 103, w: 20, h: 14, snow: 0.25, lean: -1 },
  // Nanhu / Xueshan Northern Cluster
  { x: 742, y: 162, w: 24, h: 20, snow: 0.55, lean: -2 },
  { x: 718, y: 185, w: 28, h: 24, snow: 0.72, lean: -1.5 },
  { x: 734, y: 206, w: 26, h: 23, snow: 0.68, lean: 1 },
  { x: 696, y: 228, w: 28, h: 25, snow: 0.78, lean: -2 },
  { x: 716, y: 248, w: 30, h: 27, snow: 0.85, lean: -1 }, // 雪山
  { x: 678, y: 266, w: 24, h: 21, snow: 0.58, lean: -1.5 },
  // Hehuan / Qilai / Nenggao Central Cluster
  { x: 706, y: 292, w: 30, h: 27, snow: 0.85, lean: -2 }, // 合歡山
  { x: 684, y: 318, w: 28, h: 26, snow: 0.82, lean: 1 },
  { x: 700, y: 344, w: 27, h: 24, snow: 0.75, lean: -1.5 },
  { x: 678, y: 368, w: 30, h: 27, snow: 0.84, lean: -1 },
  { x: 692, y: 396, w: 26, h: 23, snow: 0.72, lean: 1 },
  { x: 668, y: 422, w: 28, h: 26, snow: 0.82, lean: -2 },
  // Yushan & Alishan Iconic Alpine Cluster
  { x: 646, y: 454, w: 36, h: 33, snow: 0.96, lean: -2 }, // 玉山主峰
  { x: 670, y: 468, w: 28, h: 25, snow: 0.78, lean: 1.5 },
  { x: 616, y: 482, w: 26, h: 22, snow: 0.65, lean: -1.5 }, // 阿里山
  { x: 650, y: 500, w: 29, h: 26, snow: 0.82, lean: -1 },
  { x: 596, y: 516, w: 24, h: 19, snow: 0.45, lean: -1 },
  // Guanshan & Southern Central Range
  { x: 636, y: 540, w: 31, h: 28, snow: 0.86, lean: -1.5 }, // 關山
  { x: 618, y: 572, w: 27, h: 24, snow: 0.72, lean: 1 },
  { x: 626, y: 604, w: 26, h: 23, snow: 0.68, lean: -1.5 },
  { x: 610, y: 636, w: 29, h: 26, snow: 0.80, lean: -1 }, // 北大武山
  { x: 602, y: 672, w: 24, h: 21, snow: 0.55, lean: 1 },
  { x: 598, y: 710, w: 20, h: 17, snow: 0.35, lean: -1 },
  // East Coastal Range (海岸山脈)
  { x: 734, y: 344, w: 18, h: 15, snow: 0.35, lean: -1 },
  { x: 724, y: 392, w: 19, h: 16, snow: 0.38, lean: -1 },
  { x: 714, y: 444, w: 18, h: 15, snow: 0.35, lean: -1 },
  { x: 696, y: 498, w: 18, h: 15, snow: 0.32, lean: -1 },
];

// Curved golden terraced rice & wheat paddy clusters on Taiwan's western & southern plains (style05.jpg signature)
interface TerraceCluster {
  cx: number;
  cy: number;
  rings: number;
  startR: number;
  stepR: number;
  angleStart: number;
  angleEnd: number;
  scaleX: number;
  scaleY: number;
  rot: number;
  goldenBoost: number; // 0..1 warm wheat/gold intensity
}

const GOLDEN_TERRACE_CLUSTERS: TerraceCluster[] = [
  // Taoyuan / Hsinchu sunlit rolling terraces
  { cx: 648, cy: 172, rings: 5, startR: 8, stepR: 5.5, angleStart: -2.4, angleEnd: 0.4, scaleX: 1.2, scaleY: 0.72, rot: -0.35, goldenBoost: 0.55 },
  // Miaoli / Taichung western foothills
  { cx: 580, cy: 268, rings: 5, startR: 9, stepR: 5.8, angleStart: -2.2, angleEnd: 0.6, scaleX: 1.25, scaleY: 0.74, rot: -0.25, goldenBoost: 0.65 },
  // Changhua golden rice paddies
  { cx: 526, cy: 356, rings: 6, startR: 10, stepR: 6.2, angleStart: -2.5, angleEnd: 0.55, scaleX: 1.15, scaleY: 0.78, rot: -0.2, goldenBoost: 0.85 },
  // Yunlin broad golden terraces
  { cx: 508, cy: 424, rings: 7, startR: 10, stepR: 6.4, angleStart: -2.6, angleEnd: 0.45, scaleX: 1.2, scaleY: 0.76, rot: -0.15, goldenBoost: 0.92 },
  // Chiayi / Chianan golden plain terraces
  { cx: 518, cy: 488, rings: 7, startR: 11, stepR: 6.4, angleStart: -2.5, angleEnd: 0.5, scaleX: 1.22, scaleY: 0.75, rot: -0.18, goldenBoost: 0.95 },
  // Tainan iconic sunlit golden wheat & rice terraces (signature style05.jpg focal glow)
  { cx: 498, cy: 552, rings: 8, startR: 11, stepR: 6.6, angleStart: -2.65, angleEnd: 0.55, scaleX: 1.25, scaleY: 0.76, rot: -0.12, goldenBoost: 1.0 },
  // Kaohsiung plains terraces
  { cx: 534, cy: 614, rings: 6, startR: 10, stepR: 6.2, angleStart: -2.5, angleEnd: 0.45, scaleX: 1.18, scaleY: 0.74, rot: -0.22, goldenBoost: 0.88 },
  // Pingtung southern sunlit paddies
  { cx: 560, cy: 690, rings: 6, startR: 9, stepR: 6.0, angleStart: -2.4, angleEnd: 0.5, scaleX: 1.15, scaleY: 0.72, rot: -0.15, goldenBoost: 0.92 },
  // Yilan Lanyang plain terraces
  { cx: 752, cy: 214, rings: 4, startR: 8, stepR: 5.4, angleStart: -2.1, angleEnd: 0.5, scaleX: 1.1, scaleY: 0.72, rot: 0.25, goldenBoost: 0.65 },
  // Hualien East Rift Valley terraces
  { cx: 706, cy: 416, rings: 5, startR: 7, stepR: 5.2, angleStart: -2.2, angleEnd: 0.6, scaleX: 0.8, scaleY: 1.35, rot: 0.2, goldenBoost: 0.7 },
];

function distToSegmentSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 0.0001) return wx * wx + wy * wy;
  let t = (wx * vx + wy * vy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return dx * dx + dy * dy;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

/**
 * Fast 2-pass Chamfer Euclidean distance transform.
 */
function computeDistanceField(mask: Uint8Array, targetIsLand: boolean): Float32Array {
  const INF = 1e6;
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const isTarget = targetIsLand ? mask[i] > 0 : mask[i] === 0;
    dist[i] = isTarget ? 0 : INF;
  }

  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const idx = row + x;
      let d = dist[idx];
      if (d === 0) continue;
      if (x > 0) {
        const c = dist[idx - 1] + 1;
        if (c < d) d = c;
      }
      if (y > 0) {
        const up = idx - W;
        const c = dist[up] + 1;
        if (c < d) d = c;
        if (x > 0) {
          const cd = dist[up - 1] + 1.4142;
          if (cd < d) d = cd;
        }
        if (x < W - 1) {
          const cd = dist[up + 1] + 1.4142;
          if (cd < d) d = cd;
        }
      }
      dist[idx] = d;
    }
  }

  for (let y = H - 1; y >= 0; y--) {
    const row = y * W;
    for (let x = W - 1; x >= 0; x--) {
      const idx = row + x;
      let d = dist[idx];
      if (d === 0) continue;
      if (x < W - 1) {
        const c = dist[idx + 1] + 1;
        if (c < d) d = c;
      }
      if (y < H - 1) {
        const dn = idx + W;
        const c = dist[dn] + 1;
        if (c < d) d = c;
        if (x > 0) {
          const cd = dist[dn - 1] + 1.4142;
          if (cd < d) d = cd;
        }
        if (x < W - 1) {
          const cd = dist[dn + 1] + 1.4142;
          if (cd < d) d = cd;
        }
      }
      dist[idx] = d;
    }
  }

  return dist;
}

/**
 * Generates the style05.jpg-inspired Golden-Hour Oil-Painted 3D Tabletop Relief map
 * of Taiwan, Penghu, Kinmen, Lienchiang (Matsu), and SE Mainland China (860x860 @ 2x).
 * Memoized at module level so it computes once in <150ms.
 */
let cachedTerrainDataUrl: string | null = null;

export function getTaiwanTerrainDataUrl(): string | null {
  if (cachedTerrainDataUrl) return cachedTerrainDataUrl;
  if (typeof document === 'undefined') return null;

  // 1. Rasterize softly feathered anti-aliased masks for Taiwan, Outlying Islands, and Mainland China
  const twCanvas = document.createElement('canvas');
  twCanvas.width = W;
  twCanvas.height = H;
  const twCtx = twCanvas.getContext('2d');
  if (!twCtx) return null;

  twCtx.clearRect(0, 0, W, H);
  twCtx.filter = 'blur(0.8px)';
  for (const id of TAIWAN_MAP_RENDER_ORDER) {
    const geom = TAIWAN_MAP_GEOMETRIES[id];
    const p2d = new Path2D(geom.path);
    twCtx.fillStyle = OUTLYING_ISLANDS.has(id) ? '#00ff00' : '#ff0000';
    twCtx.fill(p2d);
  }
  twCtx.filter = 'none';
  const twData = twCtx.getImageData(0, 0, W, H).data;

  const cnCanvas = document.createElement('canvas');
  cnCanvas.width = W;
  cnCanvas.height = H;
  const cnCtx = cnCanvas.getContext('2d');
  if (!cnCtx) return null;

  cnCtx.clearRect(0, 0, W, H);
  cnCtx.filter = 'blur(0.95px)';
  cnCtx.fillStyle = '#ffffff';
  cnCtx.fill(new Path2D(MAINLAND_COAST_PATH));
  cnCtx.filter = 'none';
  const cnData = cnCtx.getImageData(0, 0, W, H).data;

  const twAlpha = new Float32Array(W * H);
  const cnAlpha = new Float32Array(W * H);
  const isOutlying = new Uint8Array(W * H);
  const allLandMask = new Uint8Array(W * H);

  for (let i = 0; i < W * H; i++) {
    const r = twData[i * 4];
    const g = twData[i * 4 + 1];
    const aTw = twData[i * 4 + 3] / 255;
    const aCn = cnData[i * 4 + 3] / 255;

    twAlpha[i] = aTw;
    cnAlpha[i] = aCn;
    if (g > r && aTw > 0.15) {
      isOutlying[i] = 1;
    }
    if (aTw > 0.35 || aCn > 0.35) {
      allLandMask[i] = 1;
    }
  }

  // 2. Smooth distance fields for coastal shoals & inland elevation rise
  const distInland = computeDistanceField(allLandMask, false);
  const distCoast = computeDistanceField(allLandMask, true);

  // 3. Build topographic heightmap for Taiwan + Mainland China
  const heightMap = new Float32Array(W * H);
  const cnHeightMap = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const idx = row + x;
      const aTw = twAlpha[idx];
      const aCn = cnAlpha[idx];

      if (aCn > 0.005) {
        const dIn = distInland[idx];
        const coastSmooth = smoothstep(0, 20, dIn);
        const hills = fbm(x * 0.017, y * 0.017, 3);
        const ridges = ridgedFbm(x * 0.013, y * 0.013, 3);
        cnHeightMap[idx] = clamp01(
          (0.1 + hills * 0.28 + ridges * 0.26) * (0.28 + 0.72 * coastSmooth)
        );
      }

      if (aTw > 0.005) {
        const dIn = distInland[idx];
        const coastSmooth = smoothstep(0, 15, dIn);

        if (isOutlying[idx] === 1) {
          const n = fbm(x * 0.055, y * 0.055, 3);
          heightMap[idx] = clamp01((0.1 + 0.24 * coastSmooth) * (0.72 + 0.52 * n));
          continue;
        }

        let ridgeH = 0;
        for (let s = 0; s < TAIWAN_RIDGE_SEGMENTS.length; s++) {
          const seg = TAIWAN_RIDGE_SEGMENTS[s];
          const dSq = distToSegmentSq(x, y, seg.ax, seg.ay, seg.bx, seg.by);
          const invW = 1 / (seg.width * seg.width);
          const contrib = seg.weight * Math.exp(-dSq * invW);
          if (contrib > ridgeH) ridgeH = contrib;
        }

        let peakH = 0;
        for (let p = 0; p < TAIWAN_PEAKS.length; p++) {
          const pk = TAIWAN_PEAKS[p];
          const dx = x - pk.x;
          const dy = y - pk.y;
          const dSq = dx * dx + dy * dy;
          peakH += pk.h * Math.exp(-dSq / (pk.r * pk.r));
        }

        let plainCut = 0;
        for (let pl = 0; pl < TAIWAN_PLAINS.length; pl++) {
          const b = TAIWAN_PLAINS[pl];
          const dx = (x - b.x) / b.rx;
          const dy = (y - b.y) / b.ry;
          const dSq = dx * dx + dy * dy;
          if (dSq < 4.5) {
            plainCut += b.depth * Math.exp(-dSq * 1.15);
          }
        }

        const crag = ridgedFbm(x * 0.022, y * 0.022, 3);
        const detail = fbm(x * 0.048, y * 0.048, 3);

        const baseElev = 0.06 + 0.12 * clamp01(dIn / 54);
        const rawMountain = (ridgeH * 0.8 + peakH * 0.62) * (0.62 + 0.56 * crag);
        let h =
          (baseElev + rawMountain + (detail - 0.5) * 0.07 - plainCut) *
          (0.24 + 0.76 * coastSmooth);

        // Keep western coastal plains sunlit, broad & golden
        if (x < 575 && y > 240 && y < 650) {
          h *= 0.52 + 0.48 * clamp01((x - 490) / 85);
        }

        heightMap[idx] = clamp01(h);
      }
    }
  }

  // 4. Shade & Paint into 860x860 ImageData (Exact style05.jpg Golden-Hour Oil-Painted Palette)
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = W;
  baseCanvas.height = H;
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) return null;

  const img = baseCtx.createImageData(W, H);
  const px = img.data;

  // Dramatic golden-hour NW directional sunlight (matches style05.jpg's NW sun reflection)
  const lx = -0.68;
  const ly = -0.54;
  const lz = 0.5;
  const lLen = Math.hypot(lx, ly, lz);
  const Lx = lx / lLen;
  const Ly = ly / lLen;
  const Lz = lz / lLen;

  // NW Taiwan Strait Golden-Hour Sun Center
  const sunX = 310;
  const sunY = 122;

  for (let y = 0; y < H; y++) {
    const row = y * W;
    const yUp = y > 0 ? y - 1 : 0;
    const yDn = y < H - 1 ? y + 1 : H - 1;

    for (let x = 0; x < W; x++) {
      const idx = row + x;
      const p4 = idx * 4;
      const aTw = twAlpha[idx];
      const aCn = cnAlpha[idx];

      // === 1. GOLDEN-HOUR SUNLIT TAIWAN STRAIT & DEEP PRUSSIAN-TEAL PACIFIC ===
      const swell = fbm(x * 0.011, y * 0.022, 2);
      const dc = distCoast[idx];

      // Base Pacific Ocean: deep painterly sapphire-Prussian teal (#17384c -> #244f66)
      const eastDepth = smoothstep(320, 820, x);
      const southDepth = smoothstep(140, 820, y);
      let ocR = lerp(36, 21, eastDepth * 0.72 + southDepth * 0.28) + (swell - 0.5) * 7;
      let ocG = lerp(79, 54, eastDepth * 0.72 + southDepth * 0.28) + (swell - 0.5) * 9;
      let ocB = lerp(102, 74, eastDepth * 0.72 + southDepth * 0.28) + (swell - 0.5) * 10;

      // Golden-Hour Sun Reflection in the NW Taiwan Strait (#fbe8ad -> #e3bf76 -> #94b0b2)
      const dxSun = (x - sunX) / 235;
      const dySun = (y - sunY) / 315;
      // Slightly elongated down the Strait channel
      const sunDist = Math.hypot(dxSun, dySun);
      const sunHaze = clamp01(1 - sunDist);
      const sunMid = Math.pow(sunHaze, 1.55);
      const sunCore = Math.pow(clamp01(1 - Math.hypot((x - sunX) / 145, (y - sunY) / 175)), 1.9);

      // Blend hazy warm teal (#94b0b2) -> warm golden-ochre (#e3bf76) -> luminous sunlit cream (#fbe8ad)
      ocR = lerp(ocR, 148, sunHaze * 0.62);
      ocG = lerp(ocG, 176, sunHaze * 0.62);
      ocB = lerp(ocB, 178, sunHaze * 0.62);

      ocR = lerp(ocR, 227, sunMid * 0.78);
      ocG = lerp(ocG, 191, sunMid * 0.78);
      ocB = lerp(ocB, 118, sunMid * 0.78);

      ocR = lerp(ocR, 251, sunCore * 0.85);
      ocG = lerp(ocG, 232, sunCore * 0.85);
      ocB = lerp(ocB, 173, sunCore * 0.85);

      // Soft horizontal golden wave shimmer streaks across the sunlit Taiwan Strait
      if (sunHaze > 0.08) {
        const wavePhase = y * 0.36 + (swell - 0.5) * 6.5 + Math.sin(x * 0.025) * 1.4;
        const streak = Math.pow(0.5 + 0.5 * Math.sin(wavePhase), 4.0);
        const fineStreak = Math.pow(
          0.5 + 0.5 * Math.sin(y * 0.74 - x * 0.015 + swell * 4.2),
          6.0
        );
        const shimmer = (streak * 0.65 + fineStreak * 0.35) * sunHaze * (0.28 + 0.55 * sunMid);
        ocR = lerp(ocR, 255, shimmer * 0.68);
        ocG = lerp(ocG, 241, shimmer * 0.62);
        ocB = lerp(ocB, 192, shimmer * 0.45);
      }

      // Warm coastal turquoise / golden-olive shoals around every shoreline
      if (dc < 30) {
        const dEff = Math.max(0, dc + (swell - 0.5) * 2.0);
        const outerT = smoothstep(30, 0, dEff);
        // Warmer golden-turquoise shoals in the sunlit Strait, rich teal-jade on Pacific side
        const shoalR = lerp(52, 132, sunHaze * 0.75);
        const shoalG = lerp(114, 158, sunHaze * 0.75);
        const shoalB = lerp(124, 128, sunHaze * 0.75);
        ocR = lerp(ocR, shoalR, outerT * 0.56);
        ocG = lerp(ocG, shoalG, outerT * 0.56);
        ocB = lerp(ocB, shoalB, outerT * 0.56);

        if (dEff < 10) {
          const innerT = smoothstep(10, 0, dEff);
          const foamR = lerp(118, 212, sunHaze * 0.65);
          const foamG = lerp(164, 198, sunHaze * 0.65);
          const foamB = lerp(152, 134, sunHaze * 0.65);
          ocR = lerp(ocR, foamR, innerT * 0.58);
          ocG = lerp(ocG, foamG, innerT * 0.58);
          ocB = lerp(ocB, foamB, innerT * 0.58);
        }
      }

      let r = ocR;
      let g = ocG;
      let b = ocB;

      // === 2. WARM SUNLIT MAINLAND CHINA SE COAST (Golden-Olive & Bronze-Green Relief) ===
      if (aCn > 0.005) {
        const xL = x > 0 ? x - 1 : 0;
        const xR = x < W - 1 ? x + 1 : W - 1;
        const h = cnHeightMap[idx];
        const dzdx = (cnHeightMap[row + xR] - cnHeightMap[row + xL]) * 9.5;
        const dzdy = (cnHeightMap[yDn * W + x] - cnHeightMap[yUp * W + x]) * 9.5;
        const invN = 1 / Math.hypot(-dzdx, -dzdy, 1);
        const ndotl = clamp01((-dzdx * Lx - dzdy * Ly + Lz) * invN);

        const paintNoise = fbm(x * 0.042, y * 0.042, 2);
        const coastWarm = smoothstep(26, 0, distInland[idx]);

        // Warm golden-olive & sunlit bronze-green matching style05.jpg upper-left mainland
        let mr = lerp(168, 108, clamp01(h * 1.9)) + (paintNoise - 0.5) * 14;
        let mg = lerp(158, 114, clamp01(h * 1.9)) + (paintNoise - 0.5) * 12;
        let mb = lerp(84, 56, clamp01(h * 1.9)) + (paintNoise - 0.5) * 8;

        // Warm golden-ochre shoreline edge
        mr = lerp(mr, 196, coastWarm * 0.34);
        mg = lerp(mg, 174, coastWarm * 0.34);
        mb = lerp(mb, 104, coastWarm * 0.34);

        const shade = 0.72 + 0.44 * ndotl;
        mr *= shade;
        mg *= shade * (0.98 + 0.04 * ndotl);
        mb *= 0.76 + 0.3 * ndotl;

        // Golden-hour rim haze toward the sun
        mr = lerp(mr, 224, sunHaze * 0.16);
        mg = lerp(mg, 198, sunHaze * 0.14);
        mb = lerp(mb, 126, sunHaze * 0.1);

        const mixCn = smoothstep(0.02, 0.96, aCn);
        r = lerp(r, mr, mixCn);
        g = lerp(g, mg, mixCn);
        b = lerp(b, mb, mixCn);
      }

      // === 3. TAIWAN & OUTLYING ISLANDS (style05.jpg Golden-Olive Plains + Emerald 3D Alpine Relief) ===
      if (aTw > 0.005) {
        const xL = x > 0 ? x - 1 : 0;
        const xR = x < W - 1 ? x + 1 : W - 1;
        const h = heightMap[idx];
        const hL = heightMap[row + xL];
        const hR = heightMap[row + xR];
        const hU = heightMap[yUp * W + x];
        const hD = heightMap[yDn * W + x];

        // Crisp sculptural 3D directional hillshade
        const reliefStrength = 13.5;
        const dzdx = (hR - hL) * reliefStrength;
        const dzdy = (hD - hU) * reliefStrength;
        const invN = 1 / Math.hypot(-dzdx, -dzdy, 1);
        const nx = -dzdx * invN;
        const ny = -dzdy * invN;
        const nz = invN;
        const ndotl = clamp01(nx * Lx + ny * Ly + nz * Lz);

        const patch = fbm(x * 0.048, y * 0.048, 2);
        const isMain = isOutlying[idx] === 0;

        // Strong western coastal plains golden-ochre warmth (#d8c258 -> #b5a946)
        const westPlain = isMain
          ? clamp01((610 - x) / 118) * clamp01(1 - h / 0.28) +
            (x > 730 && y > 180 && y < 245 ? 0.55 * clamp01(1 - h / 0.24) : 0)
          : 0.45 * clamp01(1 - h / 0.26);

        let tr = 0;
        let tg = 0;
        let tb = 0;

        if (h < 0.19) {
          // Lush sunlit golden-ochre & olive-green western plains (#d8c258, #b5a946, #7a963d)
          const t = h / 0.19;
          const plainMix = clamp01(westPlain * (0.5 + 0.5 * patch));
          const lr = lerp(176, 122, t);
          const lg = lerp(168, 150, t);
          const lb = lerp(74, 61, t);
          tr = lerp(lr, 218, plainMix * 0.78) + (patch - 0.5) * 14;
          tg = lerp(lg, 194, plainMix * 0.78) + (patch - 0.5) * 12;
          tb = lerp(lb, 88, plainMix * 0.78) + (patch - 0.5) * 8;
        } else if (h < 0.42) {
          // Sunlit foothills transitioning to lush olive-emerald (#7a963d -> #426d2f)
          const t = (h - 0.19) / 0.23;
          tr = lerp(122, 66, t) + (patch - 0.5) * 12;
          tg = lerp(150, 109, t) + (patch - 0.5) * 12;
          tb = lerp(61, 47, t) + (patch - 0.5) * 8;
        } else if (h < 0.7) {
          // Alpine forest slopes: bright yellow-green sunlit NW vs deep pine-emerald SE
          const t = (h - 0.42) / 0.28;
          tr = lerp(76, 54, t) + (patch - 0.5) * 10;
          tg = lerp(118, 96, t) + (patch - 0.5) * 10;
          tb = lerp(48, 52, t) + (patch - 0.5) * 8;
        } else {
          // High alpine ridge crests rising to sunlit warm ivory-snow (#b8be8a -> #f2ebd4)
          const t = clamp01((h - 0.7) / 0.3);
          tr = lerp(142, 240, t);
          tg = lerp(154, 232, t);
          tb = lerp(104, 206, t);
        }

        // Warm golden-hour directional illumination + deep pine-emerald SE shadows
        const sunLift = 0.62 + 0.58 * ndotl;
        tr *= sunLift;
        tg *= 0.66 + 0.52 * ndotl;
        tb *= 0.62 + 0.42 * ndotl;

        // Warm golden highlight boost on NW-facing slopes
        const sunFace = smoothstep(0.62, 0.96, ndotl);
        if (sunFace > 0.01) {
          tr = lerp(tr, 238, sunFace * (h > 0.52 ? 0.36 : 0.2));
          tg = lerp(tg, 224, sunFace * (h > 0.52 ? 0.34 : 0.18));
          tb = lerp(tb, 152, sunFace * (h > 0.52 ? 0.26 : 0.08));
        }

        // Rich deep pine-emerald shadow (#1a4226) on SE mountain faces
        const shadowAmt = clamp01(0.58 - ndotl);
        if (shadowAmt > 0.02) {
          const sMix = shadowAmt * (h > 0.26 ? 0.58 : 0.3);
          tr = lerp(tr, 24, sMix);
          tg = lerp(tg, 64, sMix);
          tb = lerp(tb, 38, sMix);
        }

        const mixTw = smoothstep(0.02, 0.96, aTw);
        r = lerp(r, tr, mixTw);
        g = lerp(g, tg, mixTw);
        b = lerp(b, tb, mixTw);
      }

      px[p4] = clampByte(r);
      px[p4 + 1] = clampByte(g);
      px[p4 + 2] = clampByte(b);
      px[p4 + 3] = 255;
    }
  }

  baseCtx.putImageData(img, 0, 0);

  // 5. Composite onto 2x high-resolution output canvas (1720 x 1720) with:
  //    (a) Painted curved golden rice/wheat terraces on western & southern plains
  //    (b) Sculpted 3D hand-painted faceted alpine mountain peaks
  //    (c) Delicate sunlit blue-silver rivers with warm sandbanks
  //    (d) Crisp beveled golden-hour coastline rim
  const outCanvas = document.createElement('canvas');
  outCanvas.width = W * SCALE;
  outCanvas.height = H * SCALE;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(baseCanvas, 0, 0, W * SCALE, H * SCALE);

  ctx.save();
  ctx.scale(SCALE, SCALE);

  const mainIslandPath = new Path2D(TAIWAN_MAIN_SILHOUETTE_PATH);

  // --- (a) CLIP TO TAIWAN MAIN ISLAND: PAINTED CURVED GOLDEN RICE/WHEAT TERRACES ---
  ctx.save();
  ctx.clip(mainIslandPath);

  for (const cluster of GOLDEN_TERRACE_CLUSTERS) {
    ctx.save();
    ctx.translate(cluster.cx, cluster.cy);
    ctx.rotate(cluster.rot);
    ctx.scale(cluster.scaleX, cluster.scaleY);

    // Subtle warm sunlit golden glow beneath the terraced plain
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, cluster.startR + cluster.rings * cluster.stepR + 8);
    grad.addColorStop(0, `rgba(232, 206, 94, ${0.26 * cluster.goldenBoost})`);
    grad.addColorStop(0.7, `rgba(186, 174, 68, ${0.14 * cluster.goldenBoost})`);
    grad.addColorStop(1, 'rgba(122, 150, 61, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, cluster.startR + cluster.rings * cluster.stepR + 8, 0, Math.PI * 2);
    ctx.fill();

    // Paint concentric curved golden terrace steps with rich dark-olive riser shadows
    for (let i = 0; i < cluster.rings; i++) {
      const r = cluster.startR + i * cluster.stepR;
      const a0 = cluster.angleStart + (i % 2 === 0 ? 0.08 : -0.05);
      const a1 = cluster.angleEnd - (i % 2 === 0 ? 0.04 : 0.12);

      // Rich dark-olive terrace riser shadow (#4c5e25) offset SE
      ctx.beginPath();
      ctx.arc(0.9, 1.35, r, a0, a1);
      ctx.strokeStyle = 'rgba(56, 74, 24, 0.74)';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Warm golden-yellow sunlit terrace deck (#e5c85c)
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a1);
      ctx.strokeStyle =
        i % 2 === 0
          ? `rgba(232, 202, 88, ${0.68 + 0.18 * cluster.goldenBoost})`
          : `rgba(202, 184, 72, ${0.6 + 0.16 * cluster.goldenBoost})`;
      ctx.lineWidth = 2.75;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Luminous golden sunlit rim highlight on inner/NW terrace lip
      ctx.beginPath();
      ctx.arc(-0.45, -0.55, r - 0.35, a0 + 0.05, a1 - 0.08);
      ctx.strokeStyle = `rgba(252, 236, 152, ${0.38 * cluster.goldenBoost})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- (b) HAND-PAINTED 3D FACETED ALPINE MOUNTAIN PEAKS (Central, Xueshan, Yushan, Coastal) ---
  for (const pk of SCULPTED_ALPINE_PEAKS) {
    const halfW = pk.w * 0.54;
    const peakX = pk.x + pk.lean;
    const peakY = pk.y - pk.h * 0.64;
    const baseY = pk.y + pk.h * 0.38;
    const midRidgeX = pk.x + pk.lean * 0.35 + pk.w * 0.05;
    const midRidgeY = pk.y + pk.h * 0.28;

    // Soft SE ambient cast shadow at mountain base
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(pk.x + pk.w * 0.22, baseY + 1.5, halfW * 0.92, pk.h * 0.22, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(18, 46, 26, 0.42)';
    ctx.fill();
    ctx.restore();

    // Left / NW Sunlit Facet: warm yellow-green (#89a848) rising to sunlit ivory-snow (#f2ebd4)
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(pk.x - halfW, baseY);
    ctx.quadraticCurveTo(pk.x - halfW * 0.32, baseY + 2.2, midRidgeX, midRidgeY);
    ctx.closePath();

    const sunGrad = ctx.createLinearGradient(peakX, peakY, pk.x - halfW * 0.4, baseY);
    if (pk.snow > 0.6) {
      sunGrad.addColorStop(0, '#f5eed8');
      sunGrad.addColorStop(0.28, '#d2d488');
      sunGrad.addColorStop(0.62, '#89a848');
      sunGrad.addColorStop(1, '#587b30');
    } else {
      sunGrad.addColorStop(0, '#cfd882');
      sunGrad.addColorStop(0.45, '#89a848');
      sunGrad.addColorStop(1, '#4f732c');
    }
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Right / SE Shadowed Facet: deep rich pine-emerald (#1a4226 -> #295a34)
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(midRidgeX, midRidgeY);
    ctx.quadraticCurveTo(pk.x + halfW * 0.5, baseY + 2.4, pk.x + halfW, baseY);
    ctx.closePath();

    const shadGrad = ctx.createLinearGradient(peakX, peakY, pk.x + halfW * 0.85, baseY);
    shadGrad.addColorStop(0, pk.snow > 0.72 ? '#7ea06c' : '#35663b');
    shadGrad.addColorStop(0.32, '#245230');
    shadGrad.addColorStop(1, '#163820');
    ctx.fillStyle = shadGrad;
    ctx.fill();

    // Secondary sculpted sub-ridge facet crease for painterly 3D chiseled look
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(pk.x + halfW * 0.45, baseY - 1);
    ctx.lineTo(pk.x + halfW * 0.16, baseY + 1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 42, 23, 0.42)';
    ctx.fill();

    // Crisp sunlit ivory-gold ridge crest highlight on NW edge
    ctx.beginPath();
    ctx.moveTo(pk.x - halfW * 0.76, baseY - pk.h * 0.22);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(midRidgeX, midRidgeY * 0.995);
    ctx.strokeStyle =
      pk.snow > 0.65 ? 'rgba(248, 241, 218, 0.78)' : 'rgba(222, 226, 150, 0.56)';
    ctx.lineWidth = pk.snow > 0.7 ? 1.15 : 0.85;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // --- (c) DELICATE PAINTED RIVERS (Sunlit Blue-Silver with Tiny Warm Sandbanks) ---
  const drawPaintedRiver = (pts: Array<[number, number]>, width: number) => {
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const mx = (prev[0] + curr[0]) * 0.5;
        const my = (prev[1] + curr[1]) * 0.5;
        ctx.quadraticCurveTo(prev[0], prev[1], mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Warm golden sandbank rim
    trace();
    ctx.strokeStyle = 'rgba(226, 202, 128, 0.52)';
    ctx.lineWidth = width + 1.5;
    ctx.stroke();

    // Crisp sunlit blue-silver water core
    trace();
    ctx.strokeStyle = 'rgba(136, 198, 218, 0.86)';
    ctx.lineWidth = width;
    ctx.stroke();

    // Delicate silver-white water highlight
    trace();
    ctx.strokeStyle = 'rgba(232, 248, 255, 0.45)';
    ctx.lineWidth = Math.max(0.45, width * 0.38);
    ctx.stroke();

    ctx.restore();
  };

  // Tamsui River (淡水河)
  drawPaintedRiver(
    [
      [714, 168],
      [721, 143],
      [724, 120],
      [712, 98],
    ],
    1.25
  );
  // Dajia River (大甲溪)
  drawPaintedRiver(
    [
      [674, 276],
      [632, 286],
      [584, 294],
      [544, 296],
    ],
    1.1
  );
  // Zhuoshui River (濁水溪)
  drawPaintedRiver(
    [
      [675, 364],
      [635, 386],
      [589, 402],
      [539, 398],
      [494, 388],
    ],
    1.45
  );
  // Gaoping River (高屏溪)
  drawPaintedRiver(
    [
      [624, 532],
      [597, 576],
      [568, 612],
      [548, 654],
      [528, 684],
    ],
    1.45
  );
  // Lanyang River (蘭陽溪)
  drawPaintedRiver(
    [
      [717, 242],
      [741, 224],
      [772, 212],
    ],
    1.1
  );

  ctx.restore(); // End Taiwan Main Island Clip

  // --- (d) GENTLE CRISP BEVELED SHORELINE AROUND TAIWAN & MAINLAND CHINA ---
  ctx.save();
  ctx.strokeStyle = 'rgba(246, 226, 164, 0.42)';
  ctx.lineWidth = 1.4;
  ctx.stroke(mainIslandPath);

  ctx.strokeStyle = 'rgba(26, 52, 42, 0.45)';
  ctx.lineWidth = 0.9;
  ctx.stroke(mainIslandPath);

  const mainlandPath = new Path2D(MAINLAND_COAST_PATH);
  ctx.strokeStyle = 'rgba(240, 214, 144, 0.36)';
  ctx.lineWidth = 1.3;
  ctx.stroke(mainlandPath);
  ctx.restore();

  ctx.restore();

  cachedTerrainDataUrl = outCanvas.toDataURL('image/png');
  return cachedTerrainDataUrl;
}

/**
 * React hook that returns the memoized high-resolution style05.jpg-inspired Taiwan terrain Data URL.
 */
export function useTaiwanTerrainDataUrl(): string | null {
  return useMemo(() => getTaiwanTerrainDataUrl(), []);
}
