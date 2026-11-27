import type { BuildingConfig, BuildingType } from '../types/game';

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  granary: {
    type: 'granary',
    name: '古早穀倉',
    maxLevel: 5,
    baseGoldCost: 110,
    baseFoodCost: 60,
    description: '以紅磚土埆築成並搭配竹編防潮的莊頭大穀倉，妥善儲糧並精製農產，大幅提升本區農田收成。',
    effectPerLevel: '本區農田糧食與金幣產量 +18%',
  },
  barracks: {
    type: 'barracks',
    name: '義民兵營',
    maxLevel: 5,
    baseGoldCost: 130,
    baseFoodCost: 100,
    description: '招募並操練地方壯丁與鄉勇的校場營寨，持續補充駐軍兵源並擴大本區駐軍上限。',
    effectPerLevel: '自動徵兵速率提升，駐軍上限 +350',
  },
  wall: {
    type: 'wall',
    name: '紅磚城防',
    maxLevel: 5,
    baseGoldCost: 150,
    baseFoodCost: 80,
    description: '仿安平熱蘭遮城與恆春古城工法修築的糯米紅磚城垣與砲台，顯著強化守軍防禦力。',
    effectPerLevel: '本區守城防禦力 +15%',
  },
  market: {
    type: 'market',
    name: '廟口夜市',
    maxLevel: 5,
    baseGoldCost: 120,
    baseFoodCost: 70,
    description: '燈火通明的媽祖廟埕市集與商行街肆，匯聚南北貨商旅，源源不絕貢獻稅金與商利。',
    effectPerLevel: '每秒自動產出金幣並提升本區商稅收入',
  },
};

export const BUILDING_LIST: BuildingConfig[] = [
  BUILDINGS.granary,
  BUILDINGS.barracks,
  BUILDINGS.wall,
  BUILDINGS.market,
];
