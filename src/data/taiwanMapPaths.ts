import type { DistrictId, MapDistrictGeometry } from '../types/game';

export const TAIWAN_MAP_VIEWBOX = {
  width: 1000,
  height: 1000,
} as const;

type Pt = readonly [number, number];

/**
 * Symmetric endpoint-preserving Chaikin smoothing.
 * Reversing input points produces the exact reversed output, guaranteeing
 * mathematically watertight, zero-gap interlocking borders between adjacent counties.
 */
function smoothPolyline(pts: readonly Pt[], iterations = 2): Pt[] {
  let curr: Pt[] = [...pts];
  for (let iter = 0; iter < iterations; iter++) {
    if (curr.length < 3) return curr;
    const next: Pt[] = [curr[0]];
    for (let i = 0; i < curr.length - 1; i++) {
      const [x0, y0] = curr[i];
      const [x1, y1] = curr[i + 1];
      next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
      next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    next.push(curr[curr.length - 1]);
    curr = next;
  }
  return curr;
}

/**
 * Closed-loop Chaikin smoothing for enclave cities and outlying islands.
 */
function smoothClosedPolygon(pts: readonly Pt[], iterations = 2): string {
  let curr: Pt[] = [...pts];
  for (let iter = 0; iter < iterations; iter++) {
    const next: Pt[] = [];
    const n = curr.length;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = curr[i];
      const [x1, y1] = curr[(i + 1) % n];
      next.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1]);
      next.push([0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    curr = next;
  }
  return (
    curr
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ') + ' Z'
  );
}

function ptsToOpenPath(pts: readonly Pt[]): string {
  return pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
}

/**
 * Builds a closed SVG path from ordered boundary segments.
 * Each segment may be traversed forward or reversed; duplicate seam vertices are collapsed.
 */
function buildPolygonFromEdges(edges: Array<{ pts: readonly Pt[]; rev?: boolean }>): string {
  const allPts: Pt[] = [];
  for (const { pts, rev } of edges) {
    const ordered = rev ? [...pts].reverse() : pts;
    const startIdx = allPts.length === 0 ? 0 : 1;
    for (let i = startIdx; i < ordered.length; i++) {
      allPts.push(ordered[i]);
    }
  }
  if (allPts.length > 1) {
    const first = allPts[0];
    const last = allPts[allPts.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.25) {
      allPts.pop();
    }
  }
  return (
    allPts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ') + ' Z'
  );
}

function twEdge(pts: readonly Pt[], iterations = 2): Pt[] {
  return smoothPolyline(pts, iterations);
}

function twClosed(pts: readonly Pt[], iterations = 2): string {
  return smoothClosedPolygon(pts, iterations);
}

function mlEdge(pts: readonly Pt[], iterations = 2): Pt[] {
  return smoothPolyline(pts, iterations);
}

// ============================================================================
// 1. MAINLAND CHINA SE COASTLINE CALIBRATED DIRECTLY TO map_golden.jpg (1000x1000)
//    Upper-left painted Fujian/Zhejiang/Guangdong landmass: x: 0..485, y: 0..562
//    7 coastal regions: 寧德, 福州, 莆田, 泉州, 廈門, 漳州, 汕頭
//    All divider lines terminate strictly at the painted coastline.
// ============================================================================
const ML_C_NINGDE = mlEdge([
  [485, 0],
  [468, 28],
  [448, 54],
  [428, 76],
  [408, 95],
]);
const ML_C_FUZHOU = mlEdge([
  [408, 95],
  [392, 118],
  [376, 140],
  [364, 158],
  [356, 174],
]);
const ML_C_PUTIAN = mlEdge([
  [356, 174],
  [346, 196],
  [334, 218],
  [322, 232],
  [308, 244],
]);
const ML_C_QUANZHOU = mlEdge([
  [308, 244],
  [292, 266],
  [264, 280],
  [230, 294],
  [198, 304],
]);
const ML_C_XIAMEN = mlEdge([
  [198, 304],
  [188, 320],
  [208, 336],
  [206, 352],
  [190, 366],
]);
const ML_C_ZHANGZHOU = mlEdge([
  [190, 366],
  [172, 388],
  [152, 412],
  [128, 430],
  [106, 446],
]);
const ML_C_SHANTOU = mlEdge([
  [106, 446],
  [96, 474],
  [84, 504],
  [64, 532],
  [40, 550],
  [0, 562],
]);

// Smooth curved inland divider lines strictly clipped to the painted landmass
const ML_B_ND_FZ = mlEdge([
  [0, 92],
  [140, 90],
  [280, 96],
  [408, 95],
]);
const ML_B_FZ_PT = mlEdge([
  [0, 174],
  [124, 170],
  [244, 176],
  [356, 174],
]);
const ML_B_PT_QZ = mlEdge([
  [0, 244],
  [108, 240],
  [212, 246],
  [308, 244],
]);
const ML_B_QZ_XM = mlEdge([
  [0, 304],
  [72, 302],
  [138, 305],
  [198, 304],
]);
const ML_B_XM_ZZ = mlEdge([
  [0, 368],
  [68, 364],
  [132, 367],
  [190, 366],
]);
const ML_B_ZZ_ST = mlEdge([
  [0, 444],
  [38, 443],
  [74, 447],
  [106, 446],
]);

export interface MainlandDistrictGeometry {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
}

export const MAINLAND_DISTRICTS: MainlandDistrictGeometry[] = [
  {
    id: 'ml_ningde',
    name: '寧德',
    path: buildPolygonFromEdges([
      { pts: [[0, 0], [485, 0]] },
      { pts: ML_C_NINGDE },
      { pts: ML_B_ND_FZ, rev: true },
      { pts: [[0, 92], [0, 0]] },
    ]),
    labelX: 332,
    labelY: 54,
  },
  {
    id: 'ml_fuzhou',
    name: '福州',
    path: buildPolygonFromEdges([
      { pts: ML_B_ND_FZ },
      { pts: ML_C_FUZHOU },
      { pts: ML_B_FZ_PT, rev: true },
      { pts: [[0, 174], [0, 92]] },
    ]),
    labelX: 268,
    labelY: 138,
  },
  {
    id: 'ml_putian',
    name: '莆田',
    path: buildPolygonFromEdges([
      { pts: ML_B_FZ_PT },
      { pts: ML_C_PUTIAN },
      { pts: ML_B_PT_QZ, rev: true },
      { pts: [[0, 244], [0, 174]] },
    ]),
    labelX: 224,
    labelY: 214,
  },
  {
    id: 'ml_quanzhou',
    name: '泉州',
    path: buildPolygonFromEdges([
      { pts: ML_B_PT_QZ },
      { pts: ML_C_QUANZHOU },
      { pts: ML_B_QZ_XM, rev: true },
      { pts: [[0, 304], [0, 244]] },
    ]),
    labelX: 168,
    labelY: 276,
  },
  {
    id: 'ml_xiamen',
    name: '廈門',
    path: buildPolygonFromEdges([
      { pts: ML_B_QZ_XM },
      { pts: ML_C_XIAMEN },
      { pts: ML_B_XM_ZZ, rev: true },
      { pts: [[0, 368], [0, 304]] },
    ]),
    labelX: 132,
    labelY: 340,
  },
  {
    id: 'ml_zhangzhou',
    name: '漳州',
    path: buildPolygonFromEdges([
      { pts: ML_B_XM_ZZ },
      { pts: ML_C_ZHANGZHOU },
      { pts: ML_B_ZZ_ST, rev: true },
      { pts: [[0, 444], [0, 368]] },
    ]),
    labelX: 90,
    labelY: 410,
  },
  {
    id: 'ml_shantou',
    name: '汕頭',
    path: buildPolygonFromEdges([
      { pts: ML_B_ZZ_ST },
      { pts: ML_C_SHANTOU },
      { pts: [[0, 562], [0, 444]] },
    ]),
    labelX: 46,
    labelY: 494,
  },
];

export const MAINLAND_DIVIDER_PATHS: string[] = [
  ML_B_ND_FZ,
  ML_B_FZ_PT,
  ML_B_PT_QZ,
  ML_B_QZ_XM,
  ML_B_XM_ZZ,
  ML_B_ZZ_ST,
].map(ptsToOpenPath);

export const MAINLAND_COAST_PATH: string = buildPolygonFromEdges([
  { pts: [[0, 0], [485, 0]] },
  { pts: ML_C_NINGDE },
  { pts: ML_C_FUZHOU },
  { pts: ML_C_PUTIAN },
  { pts: ML_C_QUANZHOU },
  { pts: ML_C_XIAMEN },
  { pts: ML_C_ZHANGZHOU },
  { pts: ML_C_SHANTOU },
  { pts: [[0, 562], [0, 0]] },
]);

export const MAINLAND_COAST_LABELS: Array<{ name: string; x: number; y: number }> = [
  ...MAINLAND_DISTRICTS.map((d) => ({ name: d.name, x: d.labelX, y: d.labelY })),
  { name: '臺灣海峽', x: 356, y: 420 },
];

// ============================================================================
// 2. SHARED TOPOLOGICAL EDGES FOR TAIWAN'S 22 DIVISIONS (1000 x 1000 viewBox)
//    Calibrated directly onto the painted Taiwan coastline & mountain spine
//    of map_golden.jpg (Edition 5: 1949 Classical Parchment Relief Map).
// ============================================================================

// --- Outer Coastlines (clockwise around Taiwan main island) ---
const C_NTP_N = twEdge([
  [806, 152],
  [822, 130],
  [838, 120],
  [854, 119],
  [874, 134],
  [890, 150],
  [914, 158],
  [936, 174],
  [946, 188],
  [928, 202],
  [912, 216],
]);

const C_YILAN_E = twEdge([
  [912, 216],
  [906, 240],
  [912, 266],
  [924, 294],
  [916, 314],
  [910, 324],
]);

const C_HUALIEN_E = twEdge([
  [910, 324],
  [898, 356],
  [894, 394],
  [884, 436],
  [872, 480],
  [862, 524],
  [850, 565],
]);

const C_TAITUNG_E = twEdge([
  [850, 565],
  [834, 608],
  [816, 654],
  [794, 696],
  [782, 718],
  [760, 742],
  [744, 754],
  [734, 758],
]);

const C_PINGTUNG_S = twEdge([
  [734, 758],
  [724, 788],
  [724, 826],
  [724, 868],
  [720, 898],
  [714, 916],
  [702, 906],
  [690, 912],
  [682, 890],
  [678, 854],
  [666, 822],
  [646, 792],
  [626, 768],
  [608, 744],
]);

const C_KAOHSIUNG_W = twEdge([
  [608, 744],
  [594, 722],
  [582, 700],
  [572, 676],
  [568, 658],
]);

const C_TAINAN_W = twEdge([
  [568, 658],
  [550, 644],
  [540, 626],
  [544, 602],
  [552, 582],
]);

const C_CHIAYI_W = twEdge([
  [552, 582],
  [554, 552],
  [560, 522],
]);

const C_YUNLIN_W = twEdge([
  [560, 522],
  [564, 496],
  [578, 468],
]);

const C_CHANGHUA_W = twEdge([
  [578, 468],
  [592, 438],
  [608, 406],
]);

const C_TAICHUNG_W = twEdge([
  [608, 406],
  [624, 374],
  [642, 342],
]);

const C_MIAOLI_W = twEdge([
  [642, 342],
  [658, 310],
  [674, 282],
  [686, 265],
]);

const C_HSINCHU_W = twEdge([
  [686, 265],
  [700, 244],
  [710, 226],
  [716, 212],
]);

const C_TAOYUAN_W = twEdge([
  [716, 212],
  [726, 188],
  [740, 170],
  [766, 160],
  [790, 156],
  [806, 152],
]);

// --- Shared Inland County Borders (each drawn ONCE as a razor-clean black dashed divider) ---
const B_NTP_YL = twEdge([
  [912, 216],
  [874, 228],
  [832, 238],
]);
const B_NTP_TY = twEdge([
  [832, 238],
  [818, 198],
  [806, 152],
]);
const B_TY_YL = twEdge([
  [832, 238],
  [810, 275],
]);
const B_TY_HC = twEdge([
  [810, 275],
  [764, 244],
  [716, 212],
]);
const B_HC_YL = twEdge([
  [810, 275],
  [795, 310],
]);
const B_HC_TC = twEdge([
  [795, 310],
  [775, 348],
]);
const B_HC_ML = twEdge([
  [775, 348],
  [730, 304],
  [686, 265],
]);
const B_ML_TC = twEdge([
  [775, 348],
  [710, 350],
  [642, 342],
]);
const B_YL_TC = twEdge([
  [795, 310],
  [815, 365],
]);
const B_YL_HL = twEdge([
  [910, 324],
  [862, 346],
  [815, 365],
]);
const B_TC_HL = twEdge([
  [815, 365],
  [795, 412],
]);
const B_TC_NT = twEdge([
  [795, 412],
  [730, 418],
  [665, 420],
]);
const B_TC_CH = twEdge([
  [665, 420],
  [636, 412],
  [608, 406],
]);
const B_CH_NT = twEdge([
  [665, 420],
  [674, 444],
  [678, 468],
]);
const B_CH_YLN = twEdge([
  [678, 468],
  [628, 470],
  [578, 468],
]);
const B_NT_HL = twEdge([
  [795, 412],
  [778, 470],
  [758, 528],
]);
const B_NT_KH = twEdge([
  [758, 528],
  [715, 536],
]);
const B_NT_CY = twEdge([
  [715, 536],
  [696, 526],
  [678, 518],
]);
const B_NT_YLN = twEdge([
  [678, 518],
  [678, 492],
  [678, 468],
]);
const B_YLN_CY = twEdge([
  [678, 518],
  [618, 522],
  [560, 522],
]);
const B_CY_KH = twEdge([
  [715, 536],
  [706, 580],
  [648, 586],
]);
const B_CY_TN = twEdge([
  [648, 586],
  [600, 584],
  [552, 582],
]);
const B_TN_KH = twEdge([
  [648, 586],
  [665, 622],
  [646, 658],
  [608, 660],
  [568, 658],
]);
const B_HL_TT = twEdge([
  [850, 565],
  [814, 578],
  [748, 564],
]);
const B_HL_KH = twEdge([
  [748, 564],
  [758, 528],
]);
const B_KH_TT = twEdge([
  [748, 564],
  [736, 585],
  [716, 636],
  [692, 688],
]);
const B_KH_PT = twEdge([
  [692, 688],
  [652, 714],
  [608, 744],
]);
const B_PT_TT = twEdge([
  [692, 688],
  [716, 738],
  [734, 758],
]);

export const TAIWAN_MAIN_SILHOUETTE_PATH: string = buildPolygonFromEdges([
  { pts: C_NTP_N },
  { pts: C_YILAN_E },
  { pts: C_HUALIEN_E },
  { pts: C_TAITUNG_E },
  { pts: C_PINGTUNG_S },
  { pts: C_KAOHSIUNG_W },
  { pts: C_TAINAN_W },
  { pts: C_CHIAYI_W },
  { pts: C_YUNLIN_W },
  { pts: C_CHANGHUA_W },
  { pts: C_TAICHUNG_W },
  { pts: C_MIAOLI_W },
  { pts: C_HSINCHU_W },
  { pts: C_TAOYUAN_W },
]);

export const TAIWAN_INLAND_BORDER_PATHS: string[] = [
  B_NTP_YL,
  B_NTP_TY,
  B_TY_YL,
  B_TY_HC,
  B_HC_YL,
  B_HC_TC,
  B_HC_ML,
  B_ML_TC,
  B_YL_TC,
  B_YL_HL,
  B_TC_HL,
  B_TC_NT,
  B_TC_CH,
  B_CH_NT,
  B_CH_YLN,
  B_NT_HL,
  B_NT_KH,
  B_NT_CY,
  B_NT_YLN,
  B_YLN_CY,
  B_CY_KH,
  B_CY_TN,
  B_TN_KH,
  B_HL_TT,
  B_HL_KH,
  B_KH_TT,
  B_KH_PT,
  B_PT_TT,
].map(ptsToOpenPath);

export const TAIWAN_ENCLAVE_IDS: DistrictId[] = [
  'keelung',
  'taipei',
  'hsinchu_city',
  'chiayi_city',
];

/**
 * Geographically faithful, watertight SVG polygons for all 29 interactive territories
 * (7 Mainland SE coastal districts + 22 administrative divisions of Taiwan)
 * calibrated directly onto map_golden.jpg (1000 x 1000).
 */
export const TAIWAN_MAP_GEOMETRIES: Record<DistrictId, MapDistrictGeometry> = {
  // === 7 Mainland SE Coastal Frontline Districts ===
  ningde: {
    id: 'ningde',
    path: MAINLAND_DISTRICTS[0].path,
    labelX: MAINLAND_DISTRICTS[0].labelX,
    labelY: MAINLAND_DISTRICTS[0].labelY,
  },

  fuzhou: {
    id: 'fuzhou',
    path: MAINLAND_DISTRICTS[1].path,
    labelX: MAINLAND_DISTRICTS[1].labelX,
    labelY: MAINLAND_DISTRICTS[1].labelY,
  },

  putian: {
    id: 'putian',
    path: MAINLAND_DISTRICTS[2].path,
    labelX: MAINLAND_DISTRICTS[2].labelX,
    labelY: MAINLAND_DISTRICTS[2].labelY,
  },

  quanzhou: {
    id: 'quanzhou',
    path: MAINLAND_DISTRICTS[3].path,
    labelX: MAINLAND_DISTRICTS[3].labelX,
    labelY: MAINLAND_DISTRICTS[3].labelY,
  },

  xiamen: {
    id: 'xiamen',
    path: MAINLAND_DISTRICTS[4].path,
    labelX: MAINLAND_DISTRICTS[4].labelX,
    labelY: MAINLAND_DISTRICTS[4].labelY,
  },

  zhangzhou: {
    id: 'zhangzhou',
    path: MAINLAND_DISTRICTS[5].path,
    labelX: MAINLAND_DISTRICTS[5].labelX,
    labelY: MAINLAND_DISTRICTS[5].labelY,
  },

  shantou: {
    id: 'shantou',
    path: MAINLAND_DISTRICTS[6].path,
    labelX: MAINLAND_DISTRICTS[6].labelX,
    labelY: MAINLAND_DISTRICTS[6].labelY,
  },

  // === 22 Administrative Divisions of Taiwan ===
  new_taipei: {
    id: 'new_taipei',
    path: buildPolygonFromEdges([
      { pts: C_NTP_N },
      { pts: B_NTP_YL },
      { pts: B_NTP_TY },
    ]),
    labelX: 882,
    labelY: 206,
  },

  keelung: {
    id: 'keelung',
    path: twClosed([
      [886, 148],
      [906, 152],
      [920, 162],
      [914, 174],
      [892, 174],
      [882, 162],
    ]),
    labelX: 902,
    labelY: 160,
  },

  taipei: {
    id: 'taipei',
    path: twClosed([
      [840, 152],
      [864, 154],
      [876, 170],
      [872, 190],
      [848, 194],
      [830, 182],
      [828, 164],
    ]),
    labelX: 854,
    labelY: 174,
  },

  taoyuan: {
    id: 'taoyuan',
    path: buildPolygonFromEdges([
      { pts: B_NTP_TY, rev: true },
      { pts: B_TY_YL },
      { pts: B_TY_HC },
      { pts: C_TAOYUAN_W },
    ]),
    labelX: 768,
    labelY: 212,
  },

  hsinchu_county: {
    id: 'hsinchu_county',
    path: buildPolygonFromEdges([
      { pts: B_TY_HC, rev: true },
      { pts: B_HC_YL },
      { pts: B_HC_TC },
      { pts: B_HC_ML },
      { pts: C_HSINCHU_W },
    ]),
    labelX: 766,
    labelY: 278,
  },

  hsinchu_city: {
    id: 'hsinchu_city',
    path: twClosed([
      [704, 224],
      [728, 228],
      [736, 244],
      [722, 254],
      [700, 250],
      [696, 236],
    ]),
    labelX: 714,
    labelY: 240,
  },

  miaoli: {
    id: 'miaoli',
    path: buildPolygonFromEdges([
      { pts: B_HC_ML, rev: true },
      { pts: B_ML_TC },
      { pts: C_MIAOLI_W },
    ]),
    labelX: 715,
    labelY: 322,
  },

  taichung: {
    id: 'taichung',
    path: buildPolygonFromEdges([
      { pts: B_ML_TC, rev: true },
      { pts: B_HC_TC, rev: true },
      { pts: B_YL_TC },
      { pts: B_TC_HL },
      { pts: B_TC_NT },
      { pts: B_TC_CH },
      { pts: C_TAICHUNG_W },
    ]),
    labelX: 695,
    labelY: 386,
  },

  changhua: {
    id: 'changhua',
    path: buildPolygonFromEdges([
      { pts: B_TC_CH, rev: true },
      { pts: B_CH_NT },
      { pts: B_CH_YLN },
      { pts: C_CHANGHUA_W },
    ]),
    labelX: 632,
    labelY: 444,
  },

  nantou: {
    id: 'nantou',
    path: buildPolygonFromEdges([
      { pts: B_TC_NT, rev: true },
      { pts: B_NT_HL },
      { pts: B_NT_KH },
      { pts: B_NT_CY },
      { pts: B_NT_YLN },
      { pts: B_CH_NT, rev: true },
    ]),
    labelX: 732,
    labelY: 476,
  },

  yunlin: {
    id: 'yunlin',
    path: buildPolygonFromEdges([
      { pts: B_CH_YLN, rev: true },
      { pts: B_NT_YLN, rev: true },
      { pts: B_YLN_CY },
      { pts: C_YUNLIN_W },
    ]),
    labelX: 618,
    labelY: 498,
  },

  chiayi_county: {
    id: 'chiayi_county',
    path: buildPolygonFromEdges([
      { pts: B_YLN_CY, rev: true },
      { pts: B_NT_CY, rev: true },
      { pts: B_CY_KH },
      { pts: B_CY_TN },
      { pts: C_CHIAYI_W },
    ]),
    labelX: 666,
    labelY: 558,
  },

  chiayi_city: {
    id: 'chiayi_city',
    path: twClosed([
      [612, 544],
      [640, 544],
      [642, 566],
      [612, 566],
    ]),
    labelX: 626,
    labelY: 555,
  },

  tainan: {
    id: 'tainan',
    path: buildPolygonFromEdges([
      { pts: B_CY_TN, rev: true },
      { pts: B_TN_KH },
      { pts: C_TAINAN_W },
    ]),
    labelX: 598,
    labelY: 622,
  },

  kaohsiung: {
    id: 'kaohsiung',
    path: buildPolygonFromEdges([
      { pts: B_CY_KH, rev: true },
      { pts: B_NT_KH, rev: true },
      { pts: B_HL_KH, rev: true },
      { pts: B_KH_TT },
      { pts: B_KH_PT },
      { pts: C_KAOHSIUNG_W },
      { pts: B_TN_KH, rev: true },
    ]),
    labelX: 640,
    labelY: 694,
  },

  pingtung: {
    id: 'pingtung',
    path: buildPolygonFromEdges([
      { pts: B_KH_PT, rev: true },
      { pts: B_PT_TT },
      { pts: C_PINGTUNG_S },
    ]),
    labelX: 682,
    labelY: 796,
  },

  yilan: {
    id: 'yilan',
    path: buildPolygonFromEdges([
      { pts: B_NTP_YL, rev: true },
      { pts: C_YILAN_E },
      { pts: B_YL_HL },
      { pts: B_YL_TC, rev: true },
      { pts: B_HC_YL, rev: true },
      { pts: B_TY_YL, rev: true },
    ]),
    labelX: 866,
    labelY: 282,
  },

  hualien: {
    id: 'hualien',
    path: buildPolygonFromEdges([
      { pts: B_YL_HL, rev: true },
      { pts: C_HUALIEN_E },
      { pts: B_HL_TT },
      { pts: B_HL_KH },
      { pts: B_NT_HL, rev: true },
      { pts: B_TC_HL, rev: true },
    ]),
    labelX: 836,
    labelY: 462,
  },

  taitung: {
    id: 'taitung',
    path: buildPolygonFromEdges([
      { pts: B_HL_TT, rev: true },
      { pts: C_TAITUNG_E },
      { pts: B_PT_TT, rev: true },
      { pts: B_KH_TT, rev: true },
    ]),
    labelX: 772,
    labelY: 668,
  },

  // === Outlying Islands Calibrated Directly onto map_golden.jpg ===
  lienchiang: {
    id: 'lienchiang',
    // Matsu Archipelago calibrated onto painted islands around (492, 92)
    path: [
      smoothClosedPolygon([
        [496, 62],
        [522, 60],
        [534, 78],
        [520, 104],
        [498, 108],
        [490, 88],
      ]),
      smoothClosedPolygon([
        [462, 108],
        [484, 106],
        [488, 126],
        [466, 132],
      ]),
      smoothClosedPolygon([
        [492, 114],
        [508, 112],
        [510, 124],
        [494, 126],
      ]),
    ].join(' '),
    labelX: 492,
    labelY: 92,
  },

  kinmen: {
    id: 'kinmen',
    // Kinmen calibrated onto painted butterfly island off Xiamen bay around (260, 310)
    path: [
      smoothClosedPolygon([
        [244, 300],
        [262, 294],
        [278, 300],
        [284, 314],
        [272, 326],
        [254, 324],
        [240, 316],
      ]),
      smoothClosedPolygon([
        [224, 306],
        [236, 304],
        [238, 316],
        [226, 318],
      ]),
    ].join(' '),
    labelX: 260,
    labelY: 310,
  },

  penghu: {
    id: 'penghu',
    // Penghu Archipelago calibrated onto painted islands around (444, 524)
    path: [
      smoothClosedPolygon([
        [436, 514],
        [456, 512],
        [466, 526],
        [454, 544],
        [436, 540],
        [430, 524],
      ]),
      smoothClosedPolygon([
        [414, 512],
        [428, 510],
        [428, 536],
        [414, 538],
      ]),
      smoothClosedPolygon([
        [416, 560],
        [430, 558],
        [432, 576],
        [418, 578],
      ]),
      smoothClosedPolygon([
        [402, 598],
        [416, 596],
        [418, 610],
        [404, 612],
      ]),
    ].join(' '),
    labelX: 444,
    labelY: 524,
  },
};

/**
 * Render order:
 * 1. 7 Mainland SE coastal territories
 * 2. Taiwan main island counties
 * 3. Enclave & coastal cities layered crisply above surrounding counties
 * 4. Outlying islands in true geographic positions
 */
export const TAIWAN_MAP_RENDER_ORDER: DistrictId[] = [
  // Mainland SE Coastal Frontline (7 territories):
  'ningde',
  'fuzhou',
  'putian',
  'quanzhou',
  'xiamen',
  'zhangzhou',
  'shantou',
  // Taiwan Main Island counties:
  'new_taipei',
  'taoyuan',
  'hsinchu_county',
  'miaoli',
  'taichung',
  'changhua',
  'nantou',
  'yunlin',
  'chiayi_county',
  'tainan',
  'kaohsiung',
  'pingtung',
  'yilan',
  'hualien',
  'taitung',
  // Layered above surrounding counties:
  'keelung',
  'taipei',
  'hsinchu_city',
  'chiayi_city',
  // Outlying islands in true geographic positions:
  'lienchiang',
  'kinmen',
  'penghu',
];

/**
 * Delicate curved sea-route connectors linking outlying islands' true geographic positions
 * to Taiwan's coastal counties and Mainland SE ports across the Taiwan Strait.
 */
export const TAIWAN_SEA_ROUTES: Array<{
  id: string;
  from: DistrictId;
  to: DistrictId;
  d: string;
}> = [
  // Taiwan <-> Outlying Islands routes
  {
    id: 'lienchiang-keelung',
    from: 'lienchiang',
    to: 'keelung',
    d: 'M 520 96 Q 715 74 892 152',
  },
  {
    id: 'kinmen-taichung',
    from: 'kinmen',
    to: 'taichung',
    d: 'M 284 316 Q 450 342 612 384',
  },
  {
    id: 'kinmen-penghu',
    from: 'kinmen',
    to: 'penghu',
    d: 'M 274 334 Q 350 436 426 510',
  },
  {
    id: 'penghu-chiayi',
    from: 'penghu',
    to: 'chiayi_county',
    d: 'M 466 522 Q 512 536 558 548',
  },
  {
    id: 'penghu-tainan',
    from: 'penghu',
    to: 'tainan',
    d: 'M 464 538 Q 508 584 550 618',
  },
  {
    id: 'penghu-kaohsiung',
    from: 'penghu',
    to: 'kaohsiung',
    d: 'M 454 550 Q 514 632 586 692',
  },
  // Cross-Strait Mainland SE <-> Outlying Islands & Taiwan routes
  {
    id: 'fuzhou-lienchiang',
    from: 'fuzhou',
    to: 'lienchiang',
    d: 'M 380 132 Q 424 110 464 112',
  },
  {
    id: 'fuzhou-keelung',
    from: 'fuzhou',
    to: 'keelung',
    d: 'M 368 154 Q 630 184 886 158',
  },
  {
    id: 'putian-taichung',
    from: 'putian',
    to: 'taichung',
    d: 'M 334 218 Q 492 276 624 374',
  },
  {
    id: 'quanzhou-kinmen',
    from: 'quanzhou',
    to: 'kinmen',
    d: 'M 266 278 Q 266 287 262 295',
  },
  {
    id: 'quanzhou-penghu',
    from: 'quanzhou',
    to: 'penghu',
    d: 'M 286 268 Q 382 380 438 512',
  },
  {
    id: 'xiamen-kinmen',
    from: 'xiamen',
    to: 'kinmen',
    d: 'M 204 330 Q 216 320 226 314',
  },
  {
    id: 'zhangzhou-kinmen',
    from: 'zhangzhou',
    to: 'kinmen',
    d: 'M 174 384 Q 214 362 246 324',
  },
  {
    id: 'zhangzhou-penghu',
    from: 'zhangzhou',
    to: 'penghu',
    d: 'M 152 412 Q 288 456 416 520',
  },
  {
    id: 'shantou-penghu',
    from: 'shantou',
    to: 'penghu',
    d: 'M 92 488 Q 252 526 414 536',
  },
  {
    id: 'shantou-kaohsiung',
    from: 'shantou',
    to: 'kaohsiung',
    d: 'M 78 514 Q 332 652 582 700',
  },
];
