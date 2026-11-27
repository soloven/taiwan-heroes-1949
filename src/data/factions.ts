import type { FactionConfig, FactionId } from '../types/game';

export const FACTIONS: Record<FactionId, FactionConfig> = {
  player: {
    id: 'player',
    name: '開台義軍',
    leaderName: '延平少帥',
    color: '#2e8b6e',
    lightColor: '#d9f2e8',
    borderColor: '#1f644e',
    description:
      '自府城安平起兵的本土義軍，承襲開台先賢遺志，屯田養民、號召群雄，立志統合蓬萊二十二郡縣。',
  },
  north_alliance: {
    id: 'north_alliance',
    name: '北台商盟',
    leaderName: '大稻埕總商・林維源',
    color: '#3b6ea5',
    lightColor: '#dbe8f6',
    borderColor: '#274d76',
    description:
      '盤據台北盆地與北台港埠的豪商聯盟，掌握茶葉、樟腦與洋行貿易，兵精糧足、城防堅固。',
  },
  central_guild: {
    id: 'central_guild',
    name: '中彰豪紳',
    leaderName: '霧峰總理・林文察',
    color: '#c78a28',
    lightColor: '#f8ecd4',
    borderColor: '#926318',
    description:
      '雄踞中台灣沃野與山城的望族聯軍，手握八堡圳豐饒糧倉與鹿港商脈，團練嚴明、進退有度。',
  },
  south_pirates: {
    id: 'south_pirates',
    name: '南洋海商',
    leaderName: '打狗海王・蔡牽',
    color: '#c83e2b',
    lightColor: '#fadcd7',
    borderColor: '#8f291b',
    description:
      '縱橫台灣海峽與黑水溝的海上霸主，盤據高屏良港與離島要衝，善使福船火砲與兩棲突襲。',
  },
  east_guardians: {
    id: 'east_guardians',
    name: '後山神衛',
    leaderName: '奇萊大頭目・瑪瑙',
    color: '#7c4d9c',
    lightColor: '#ebe0f5',
    borderColor: '#563270',
    description:
      '守護蘭陽與花東縱谷的山海神衛，憑藉中央山脈天險與原民勇士之力，威震後山、易守難攻。',
  },
  mainland_command: {
    id: 'mainland_command',
    name: '東南沿海駐軍',
    leaderName: '閩浙總督',
    color: '#9b2c2c',
    lightColor: '#f87171',
    borderColor: '#7f1d1d',
    description: '盤據閩浙粵東南沿海七大重鎮，扼守台灣海峽西岸要衝。',
  },
  neutral: {
    id: 'neutral',
    name: '地方鄉勇',
    leaderName: '各莊頭人',
    color: '#78716c',
    lightColor: '#eceae8',
    borderColor: '#57534e',
    description:
      '各地自組保鄉衛土的義民團練與廟口壯丁，無意爭霸天下，卻是兵家必爭的緩衝重鎮。',
  },
};
