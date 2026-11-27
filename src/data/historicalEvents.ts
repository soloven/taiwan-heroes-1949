import type { HistoricalEventConfig } from '../types/game';

export const START_YEAR = 1949;
export const START_MONTH = 1;
export const SECONDS_PER_MONTH = 12;

export function getGameCalendar(gameTime: number): {
  year: number;
  month: number;
  rocYear: number;
  label: string;
} {
  const elapsedMonths = Math.max(0, Math.floor(gameTime / SECONDS_PER_MONTH));
  const totalMonths = START_MONTH - 1 + elapsedMonths;
  const year = START_YEAR + Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const rocYear = year - 1911;

  return {
    year,
    month,
    rocYear,
    label: `${year}年 ${month}月 (民國${rocYear}年)`,
  };
}

export const HISTORICAL_EVENT_LIST: HistoricalEventConfig[] = [
  {
    id: 'ev_1949_rent_reduction',
    year: 1949,
    month: 3,
    title: '三七五減租',
    locationId: 'tainan',
    category: 'policy',
    summary:
      '嘉南平原與全台農村正值春耕之際，朝野力推「三七五減租」新政，限定耕地地租上限以減輕佃農重擔、激勵百姓開墾屯田。府城將如何決策？',
    choices: [
      {
        id: 'full_reform',
        label: '全面推行減租',
        effectDesc: '糧草 +800、銀兩 +400、全境民心 +10',
        foodDelta: 800,
        goldDelta: 400,
        moraleDelta: 10,
      },
      {
        id: 'war_levy',
        label: '加徵軍糧備戰',
        effectDesc: '糧草 +500、台南駐軍 +250',
        foodDelta: 500,
        troopsDelta: { districtId: 'tainan', amount: 250 },
      },
    ],
  },
  {
    id: 'ev_1949_guningtou',
    year: 1949,
    month: 10,
    title: '古寧頭戰役',
    locationId: 'kinmen',
    category: 'battle',
    summary:
      '十月秋風驟起，廈門沿海大軍集結大批船團趁夜渡海，矛頭直指金門古寧頭海灘！海峽前線告急，請即刻下達作戰方略。',
    choices: [
      {
        id: 'hold_guningtou',
        label: '死守古寧頭防線',
        effectDesc: '金門增援 +400 兵、聲望 +25（大幅提升登庸成功率），並觸發廈門跨海進攻金門',
        troopsDelta: { districtId: 'kinmen', amount: 400 },
        reputationDelta: 25,
        enemyAttack: { fromId: 'xiamen', toId: 'kinmen', troops: 550 },
      },
      {
        id: 'naval_air_suppress',
        label: '重金調度海空壓制',
        effectDesc: '花費 400 銀兩、聲望 +15（提升登庸成功率），並削弱廈門駐軍 -250',
        goldDelta: -400,
        reputationDelta: 15,
        troopsDelta: { districtId: 'xiamen', amount: -250 },
        moraleDelta: 5,
      },
    ],
  },
  {
    id: 'ev_1950_coastal_reorg',
    year: 1950,
    month: 5,
    title: '台海防務大整編',
    locationId: 'taipei',
    category: 'policy',
    summary:
      '海峽局勢風雲詭譎，北台與全島各處駐軍亟待統合編制。參謀部呈上兩份方案：其一擴編精銳野戰勁旅，其二休養生息轉入民生建設。',
    choices: [
      {
        id: 'expand_field_army',
        label: '擴編機動野戰師',
        effectDesc: '台南駐軍 +350、聲望 +20（提升登庸成功率）',
        troopsDelta: { districtId: 'tainan', amount: 350 },
        reputationDelta: 20,
      },
      {
        id: 'civil_reconstruction',
        label: '轉入民生建設',
        effectDesc: '銀兩 +900、糧草 +600',
        goldDelta: 900,
        foodDelta: 600,
      },
    ],
  },
  {
    id: 'ev_1953_land_to_tiller',
    year: 1953,
    month: 1,
    title: '耕者有其田',
    locationId: 'changhua',
    category: 'policy',
    summary:
      '彰化八堡圳與濁水溪流域推行「耕者有其田」，大批自耕農喜獲良田，中台灣糧倉迎來罕見大豐收，各地米倉與市集一片欣欣向榮。',
    choices: [
      {
        id: 'subsidize_irrigation',
        label: '補助農耕水利',
        effectDesc: '糧草 +1400、銀兩 +600、全境民心 +8',
        foodDelta: 1400,
        goldDelta: 600,
        moraleDelta: 8,
      },
      {
        id: 'farm_tax_military',
        label: '農稅充實軍費',
        effectDesc: '銀兩 +1200、聲望 +25（大幅提升登庸成功率）',
        goldDelta: 1200,
        reputationDelta: 25,
      },
    ],
  },
  {
    id: 'ev_1958_823_artillery',
    year: 1958,
    month: 8,
    title: '八二三海峽炮戰',
    locationId: 'xiamen',
    category: 'battle',
    summary:
      '盛夏傍晚，廈門沿岸重砲齊鳴，數萬發砲彈傾瀉向金門列島，台灣海峽頓成火海！前線官兵死守坑道，亟待本島運補與戰略決斷。',
    choices: [
      {
        id: 'strait_counter_supply',
        label: '跨海運補反擊',
        effectDesc: '聲望 +30（大幅提升登庸成功率）、糧草 +500，並觸發廈門對金門海峽交鋒',
        reputationDelta: 30,
        foodDelta: 500,
        enemyAttack: { fromId: 'xiamen', toId: 'kinmen', troops: 650 },
      },
      {
        id: 'fortify_main_island',
        label: '穩固本島防禦工事',
        effectDesc: '銀兩 +1000、台南駐軍 +300',
        goldDelta: 1000,
        troopsDelta: { districtId: 'tainan', amount: 300 },
      },
    ],
  },
  {
    id: 'ev_1960_cross_island_hwy',
    year: 1960,
    month: 5,
    title: '東西橫貫公路通車',
    locationId: 'hualien',
    category: 'construction',
    summary:
      '歷經數載開山劈石，鑿穿中央山脈與太魯閣峽谷的東西橫貫公路終告貫通！西部平原與後山花東自此血脈相連，商旅與軍運皆暢通無阻。',
    choices: [
      {
        id: 'develop_east_economy',
        label: '全面發展花東經濟',
        effectDesc: '銀兩 +1500、糧草 +1000、全境民心 +10',
        goldDelta: 1500,
        foodDelta: 1000,
        moraleDelta: 10,
      },
      {
        id: 'bolster_east_logistics',
        label: '強化東部國防補給',
        effectDesc: '聲望 +35（大幅提升登庸成功率）、台南駐軍 +400',
        reputationDelta: 35,
        troopsDelta: { districtId: 'tainan', amount: 400 },
      },
    ],
  },
];

export const HISTORICAL_EVENTS: Record<string, HistoricalEventConfig> = Object.fromEntries(
  HISTORICAL_EVENT_LIST.map((ev) => [ev.id, ev])
);
