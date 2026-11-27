import React from 'react';
import type { DistrictId } from '../types/game';

/**
 * 台澎金馬22縣市與東南沿海7地代表性歷史與地景地標名稱（共29區）
 * 配合《台灣群雄錄：百區爭霸》1949歷史與水墨彩繪輿圖風格
 */
export const DISTRICT_LANDMARK_NAMES: Record<DistrictId, string> = {
  taipei: '總統府',
  new_taipei: '淡水紅毛城',
  keelung: '基隆港燈塔',
  taoyuan: '大溪老街牌樓',
  hsinchu_city: '竹塹迎曦門',
  hsinchu_county: '司馬庫斯神木',
  miaoli: '龍騰斷橋',
  taichung: '台中公園湖心亭',
  changhua: '八卦山大佛',
  nantou: '日月潭慈恩塔',
  yunlin: '西螺大橋',
  chiayi_city: '北門驛木造車站',
  chiayi_county: '阿里山神木與小火車',
  tainan: '赤崁樓',
  kaohsiung: '打狗英國領事館',
  pingtung: '鵝鑾鼻燈塔',
  yilan: '龜山島',
  hualien: '太魯閣牌樓',
  taitung: '三仙台八拱橋',
  penghu: '雙心石滬',
  kinmen: '莒光樓',
  lienchiang: '東引島燈塔',
  ningde: '太姥山關隘',
  fuzhou: '福州鎮海樓',
  putian: '湄洲媽祖祖廟',
  quanzhou: '開元寺東西塔',
  xiamen: '鼓浪嶼日光岩',
  zhangzhou: '福建土樓',
  shantou: '汕頭小公園亭',
};

export interface TaiwanLandmarkIconProps {
  districtId: DistrictId;
  x?: number;
  y?: number;
  size?: number;
  className?: string;
}

const INK = '#47362b';

function renderLandmarkArtwork(districtId: DistrictId): React.ReactNode {
  switch (districtId) {
    /* 1. 台北：總統府 — 紅磚白帶中央高塔與尖頂 */
    case 'taipei':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.4" fill="#2c2218" opacity="0.22" />
          {/* 左右紅磚翼樓 */}
          <rect x="3.5" y="18.5" width="25" height="9" rx="0.6" fill="#b94a38" stroke={INK} strokeWidth="0.6" />
          {/* 巴洛克白色橫帶 */}
          <rect x="3.8" y="20.6" width="24.4" height="1.15" fill="#f5efe2" />
          <rect x="3.8" y="24.2" width="24.4" height="1.05" fill="#f5efe2" />
          {/* 翼樓小拱窗 */}
          <g fill="#47362b" opacity="0.72">
            <rect x="5.5" y="22.1" width="1.3" height="1.8" rx="0.6" />
            <rect x="8.2" y="22.1" width="1.3" height="1.8" rx="0.6" />
            <rect x="22.5" y="22.1" width="1.3" height="1.8" rx="0.6" />
            <rect x="25.2" y="22.1" width="1.3" height="1.8" rx="0.6" />
          </g>
          {/* 翼樓斜瓦檐 */}
          <path d="M3 18.7 L5 16.8 L27 16.8 L29 18.7 Z" fill="#6b5e54" stroke={INK} strokeWidth="0.55" />
          {/* 中央高塔主體 */}
          <rect x="12.2" y="9.2" width="7.6" height="18.3" rx="0.5" fill="#c85a44" stroke={INK} strokeWidth="0.6" />
          {/* 高塔白色橫帶 */}
          <rect x="12.5" y="11.4" width="7" height="1.1" fill="#f5efe2" />
          <rect x="12.5" y="15.2" width="7" height="1.1" fill="#f5efe2" />
          <rect x="12.5" y="19" width="7" height="1.1" fill="#f5efe2" />
          {/* 中央山牆與拱門 */}
          <path d="M11.4 20.4 L16 17.6 L20.6 20.4 Z" fill="#f5efe2" stroke={INK} strokeWidth="0.5" />
          <path d="M14.3 27.5 V23.2 A1.7 1.7 0 0 1 17.7 23.2 V27.5 Z" fill="#f6d884" stroke={INK} strokeWidth="0.5" />
          <path d="M14.9 27.5 V23.6 A1.1 1.1 0 0 1 17.1 23.6 V27.5 Z" fill="#5e3a29" />
          {/* 塔頂白色圓亭與尖塔 */}
          <rect x="13.7" y="6.2" width="4.6" height="3" rx="0.4" fill="#f5efe2" stroke={INK} strokeWidth="0.55" />
          <path d="M14.2 6.2 L16 2.8 L17.8 6.2 Z" fill="#7a756b" stroke={INK} strokeWidth="0.55" />
          <line x1="16" y1="1.1" x2="16" y2="3" stroke="#d4a33b" strokeWidth="0.9" />
          <circle cx="16" cy="1.2" r="0.6" fill="#f6d884" />
        </g>
      );

    /* 2. 新北：淡水紅毛城 — 紅磚方堡與旗幟 */
    case 'new_taipei':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="12.5" ry="2.3" fill="#2c2218" opacity="0.22" />
          {/* 草坡與石砌台基 */}
          <path d="M3.5 27.4 Q16 22.5 28.5 27.4 Z" fill="#669672" stroke={INK} strokeWidth="0.55" />
          <rect x="6" y="23.4" width="20" height="3.2" rx="0.4" fill="#d9ceb8" stroke={INK} strokeWidth="0.55" />
          {/* 紅磚方堡主體 */}
          <rect x="7.2" y="11.2" width="17.6" height="12.6" rx="0.5" fill="#b94a38" stroke={INK} strokeWidth="0.65" />
          {/* 磚牆高光與陰影面 */}
          <rect x="19.5" y="11.5" width="5" height="12" fill="#8e3224" opacity="0.38" />
          {/* 女兒牆雉堞 */}
          <path
            d="M6.6 11.4 V9.4 H9.2 V10.6 H11.4 V9.4 H14.4 V10.6 H17.6 V9.4 H20.6 V10.6 H22.8 V9.4 H25.4 V11.4 Z"
            fill="#c85a44"
            stroke={INK}
            strokeWidth="0.55"
          />
          {/* 殖民風格拱窗與木門 */}
          <path d="M10 18.2 V15.2 A1.4 1.4 0 0 1 12.8 15.2 V18.2 Z" fill="#f5efe2" stroke={INK} strokeWidth="0.45" />
          <path d="M19.2 18.2 V15.2 A1.4 1.4 0 0 1 22 15.2 V18.2 Z" fill="#f5efe2" stroke={INK} strokeWidth="0.45" />
          <path d="M14.3 23.8 V19.6 A1.7 1.7 0 0 1 17.7 19.6 V23.8 Z" fill="#5e3a29" stroke="#f5efe2" strokeWidth="0.55" />
          {/* 堡頂旗桿與飄揚旗幟 */}
          <line x1="21.5" y1="3.4" x2="21.5" y2="9.6" stroke="#47362b" strokeWidth="0.75" />
          <path d="M21.5 3.6 Q24.6 3.2 26.8 4.4 Q24.6 5.6 21.5 5.8 Z" fill="#e5b95c" stroke={INK} strokeWidth="0.45" />
        </g>
      );

    /* 3. 基隆：基隆港燈塔 — 白色海港燈塔、金光與港區吊臂 */
    case 'keelung':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="12.5" ry="2.2" fill="#2c2218" opacity="0.2" />
          {/* 燈塔金色光束 */}
          <path d="M14.5 9.2 L29.5 4.8 L29.5 13.4 Z" fill="#f6d884" opacity="0.42" />
          {/* 右側遠景港埠門式起重機 */}
          <g stroke="#8e5244" strokeWidth="0.8" fill="none" opacity="0.85">
            <path d="M22.5 25 L24 16.5 L27 16.5 L28 25" />
            <line x1="20.5" y1="16.5" x2="29" y2="14.2" />
            <line x1="21.2" y1="16.5" x2="21.2" y2="19.5" strokeWidth="0.55" />
          </g>
          {/* 防波堤石基 */}
          <path d="M4 25.5 L6.5 22.8 H19.5 L21.2 25.5 Z" fill="#d9ceb8" stroke={INK} strokeWidth="0.55" />
          {/* 白色圓柱燈塔 */}
          <path d="M10.4 23 L11.4 10.6 H15.6 L16.6 23 Z" fill="#f5efe2" stroke={INK} strokeWidth="0.6" />
          <rect x="11.1" y="14.5" width="4.8" height="1.2" fill="#c43e2e" opacity="0.85" />
          {/* 燈室與圓頂 */}
          <rect x="11.3" y="8" width="4.4" height="2.6" fill="#f6d884" stroke={INK} strokeWidth="0.55" />
          <path d="M10.6 8.2 Q13.5 4.8 16.4 8.2 Z" fill="#47362b" stroke={INK} strokeWidth="0.5" />
          <line x1="13.5" y1="4.8" x2="13.5" y2="6.2" stroke={INK} strokeWidth="0.6" />
          {/* 港灣波浪 */}
          <path
            d="M3.5 26.2 Q7 24.8 10.5 26.2 T17.5 26.2 T24.5 26.2 T29 26.2 V28.2 H3.5 Z"
            fill="#6ca9b5"
            stroke="#4a8594"
            strokeWidth="0.5"
          />
          <path d="M6.5 27.3 Q9.5 26.5 12.5 27.3 M19 27.3 Q22 26.5 25 27.3" stroke="#eef7f8" strokeWidth="0.6" fill="none" />
        </g>
      );

    /* 4. 桃園：大溪老街牌樓 — 巴洛克雕花山牆與三拱亭仔腳 */
    case 'taoyuan':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="12" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 主體紅磚與洗石子牌樓 */}
          <rect x="5.5" y="12" width="21" height="15.5" rx="0.5" fill="#e5dcc8" stroke={INK} strokeWidth="0.6" />
          <rect x="6.5" y="13.2" width="19" height="6.8" fill="#c85a44" opacity="0.85" />
          {/* 華麗巴洛克弧形山牆頂飾 */}
          <path
            d="M5 12.2 C6.5 9.2 9.5 9.5 11.2 7.8 C12.8 6.2 14.2 4.6 16 4.6 C17.8 4.6 19.2 6.2 20.8 7.8 C22.5 9.5 25.5 9.2 27 12.2 Z"
            fill="#f5efe2"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 山牆中央圓形勳章與兩側寶瓶 */}
          <circle cx="16" cy="8.7" r="2.1" fill="#e5b95c" stroke={INK} strokeWidth="0.5" />
          <circle cx="16" cy="8.7" r="0.9" fill="#b94a38" />
          <circle cx="6.2" cy="10.4" r="0.9" fill="#e5b95c" stroke={INK} strokeWidth="0.45" />
          <circle cx="25.8" cy="10.4" r="0.9" fill="#e5b95c" stroke={INK} strokeWidth="0.45" />
          {/* 二樓橫飾與花窗 */}
          <rect x="5" y="19.6" width="22" height="1.3" fill="#f5efe2" stroke={INK} strokeWidth="0.45" />
          <rect x="8.3" y="14.7" width="2.6" height="3.6" rx="0.4" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          <rect x="14.7" y="14.7" width="2.6" height="3.6" rx="0.4" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          <rect x="21.1" y="14.7" width="2.6" height="3.6" rx="0.4" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          {/* 一樓三連拱亭仔腳 */}
          <path d="M7.3 27.5 V23.4 A1.9 1.9 0 0 1 11.1 23.4 V27.5 Z" fill="#6b4430" stroke={INK} strokeWidth="0.45" />
          <path d="M14.1 27.5 V23.4 A1.9 1.9 0 0 1 17.9 23.4 V27.5 Z" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          <path d="M20.9 27.5 V23.4 A1.9 1.9 0 0 1 24.7 23.4 V27.5 Z" fill="#6b4430" stroke={INK} strokeWidth="0.45" />
        </g>
      );

    /* 5. 新竹市：竹塹迎曦門 — 花崗石城座與重檐燕尾城樓 */
    case 'hsinchu_city':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 石砌梯形城座 */}
          <path d="M4.2 27.4 L6.4 17.8 H25.6 L27.8 27.4 Z" fill="#dcd3c1" stroke={INK} strokeWidth="0.6" />
          {/* 城座石塊紋路與垛口 */}
          <line x1="5.8" y1="21.2" x2="26.2" y2="21.2" stroke="#a69a86" strokeWidth="0.45" />
          <line x1="5" y1="24.4" x2="27" y2="24.4" stroke="#a69a86" strokeWidth="0.45" />
          <rect x="6" y="16.5" width="20" height="1.5" fill="#c7bca6" stroke={INK} strokeWidth="0.5" />
          {/* 中央拱形城門洞 */}
          <path d="M12.6 27.4 V22.4 A3.4 3.4 0 0 1 19.4 22.4 V27.4 Z" fill="#523b2e" stroke="#b94a38" strokeWidth="0.7" />
          {/* 城樓朱柱 */}
          <rect x="9.5" y="12.2" width="13" height="4.4" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="14.2" y="13.2" width="3.6" height="2" fill="#f6d884" stroke={INK} strokeWidth="0.35" />
          {/* 下層歇山飛檐 */}
          <path d="M6.2 13.5 Q16 11.2 25.8 13.5 L23.5 11 H8.5 Z" fill="#b94a38" stroke={INK} strokeWidth="0.55" />
          {/* 上層重檐翹脊 */}
          <path d="M8.5 10.6 Q16 8.6 23.5 10.6 L20.8 7.4 Q16 8.2 11.2 7.4 Z" fill="#d64e3a" stroke={INK} strokeWidth="0.55" />
          <path d="M10.4 7.3 Q16 8.3 21.6 7.3" stroke="#e5b95c" strokeWidth="0.9" fill="none" />
        </g>
      );

    /* 6. 新竹縣：司馬庫斯神木 — 蒼勁紅檜巨木與雲霧 */
    case 'hsinchu_county':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="12" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 青苔山坡基座 */}
          <path d="M4.5 27.5 Q16 23.2 27.5 27.5 Z" fill="#4d7c5b" stroke={INK} strokeWidth="0.5" />
          {/* 盤根錯節巨木樹幹 */}
          <path
            d="M10.2 26.8 C11.4 23 12.2 19 12.5 13.8 H19.5 C19.8 19 20.6 23 22 26.8 C19.5 26 17.8 25.4 16 26.8 C14.2 25.4 12.5 26 10.2 26.8 Z"
            fill="#8b5a3c"
            stroke={INK}
            strokeWidth="0.65"
          />
          <path d="M14.3 15.5 V24.5 M17.5 16.5 V23.5" stroke="#5e3a29" strokeWidth="0.55" opacity="0.7" />
          {/* 多層蒼翠檜木樹冠 */}
          <ellipse cx="10.2" cy="14" rx="5.5" ry="3.4" fill="#386045" stroke={INK} strokeWidth="0.55" />
          <ellipse cx="21.8" cy="14" rx="5.5" ry="3.4" fill="#386045" stroke={INK} strokeWidth="0.55" />
          <ellipse cx="16" cy="11.8" rx="7.6" ry="4.4" fill="#4d7c5b" stroke={INK} strokeWidth="0.55" />
          <ellipse cx="12.5" cy="8.2" rx="4.6" ry="3" fill="#669672" stroke={INK} strokeWidth="0.5" />
          <ellipse cx="19.5" cy="8.2" rx="4.6" ry="3" fill="#669672" stroke={INK} strokeWidth="0.5" />
          <ellipse cx="16" cy="5.8" rx="5.2" ry="3.1" fill="#7cad85" stroke={INK} strokeWidth="0.5" />
          {/* 山嵐白霧輕繞 */}
          <path d="M5.5 18.2 Q11 16.8 16.5 18.2 T26.5 17.8" stroke="#f5efe2" strokeWidth="1.6" fill="none" opacity="0.75" />
        </g>
      );

    /* 7. 苗栗：龍騰斷橋 — 紅磚拱橋遺址與殘缺橋墩 */
    case 'miaoli':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 翠綠山谷草坡 */}
          <path d="M3 27.6 Q10 23.5 17 26.2 T29 27.6 Z" fill="#5c8c67" stroke={INK} strokeWidth="0.5" />
          {/* 左側完整紅磚雙拱遺址 */}
          <path
            d="M4 26.4 V11.5 L7.5 11.2 L12.5 11.8 L16.2 10.6 L18 13.8 L17.6 26.4 H14.8 V19.5 A2.2 2.2 0 0 0 10.4 19.5 V26.4 H7.4 V19.5 A1.2 1.2 0 0 0 5 19.5 V26.4 Z"
            fill="#b94a38"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 拱圈石材鑲邊 */}
          <path d="M10.4 19.5 A2.2 2.2 0 0 1 14.8 19.5" fill="none" stroke="#e5dcc8" strokeWidth="0.8" />
          {/* 斷裂處右側孤立紅磚橋墩 */}
          <path
            d="M21.4 26.4 V12.4 L23.4 11.2 L25.6 12.6 L27.6 11.8 V26.4 H25.2 V20.2 A1.1 1.1 0 0 0 23 20.2 V26.4 Z"
            fill="#b94a38"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 磚縫細節與歷史青藤 */}
          <line x1="6" y1="14.5" x2="15.5" y2="14.5" stroke="#8e3224" strokeWidth="0.5" />
          <line x1="21.8" y1="15.5" x2="27.2" y2="15.5" stroke="#8e3224" strokeWidth="0.5" />
          <circle cx="15.6" cy="11.2" r="1.4" fill="#669672" />
          <circle cx="24.2" cy="11.6" r="1.3" fill="#669672" />
        </g>
      );

    /* 8. 台中：台中公園湖心亭 — 雙併尖頂朱紅涼亭與湖面倒影 */
    case 'taichung':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 湖面水域 */}
          <ellipse cx="16" cy="25.8" rx="13.2" ry="3.2" fill="#7db8c2" stroke="#4a8594" strokeWidth="0.55" />
          <path d="M8 26.5 Q12 25.8 16 26.5 T24 26.5" stroke="#eef7f8" strokeWidth="0.65" fill="none" opacity="0.8" />
          {/* 白色基座平台 */}
          <rect x="6" y="21.4" width="20" height="2.4" rx="0.4" fill="#f5efe2" stroke={INK} strokeWidth="0.55" />
          {/* 亭身白柱與欄杆 */}
          <rect x="7.5" y="15.6" width="17" height="5.8" fill="#47362b" opacity="0.22" />
          <g stroke="#f5efe2" strokeWidth="1.15">
            <line x1="8" y1="15.4" x2="8" y2="21.4" />
            <line x1="12.8" y1="15.4" x2="12.8" y2="21.4" />
            <line x1="16" y1="15.4" x2="16" y2="21.4" />
            <line x1="19.2" y1="15.4" x2="19.2" y2="21.4" />
            <line x1="24" y1="15.4" x2="24" y2="21.4" />
          </g>
          <line x1="7.4" y1="19.8" x2="24.6" y2="19.8" stroke="#f5efe2" strokeWidth="0.8" />
          {/* 經典雙併尖頂朱紅屋頂 */}
          <path d="M4.8 16 L10.8 9.2 L16.2 15.6 Z" fill="#c43e2e" stroke={INK} strokeWidth="0.6" />
          <path d="M15.8 15.6 L21.2 9.2 L27.2 16 Z" fill="#d64e3a" stroke={INK} strokeWidth="0.6" />
          {/* 白色屋脊收邊與金頂 */}
          <path d="M5.2 15.8 L10.8 9.4 L16 15.4 L21.2 9.4 L26.8 15.8" fill="none" stroke="#f5efe2" strokeWidth="0.65" />
          <circle cx="10.8" cy="8.4" r="0.85" fill="#e5b95c" stroke={INK} strokeWidth="0.4" />
          <circle cx="21.2" cy="8.4" r="0.85" fill="#e5b95c" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    /* 9. 彰化：八卦山大佛 — 端坐黑銅釋迦牟尼大佛與蓮座 */
    case 'changhua':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="12" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 佛光微暈 */}
          <circle cx="16" cy="11.2" r="6.2" fill="#f6d884" opacity="0.32" />
          {/* 石砌台階與金色蓮花座 */}
          <rect x="6.5" y="24.5" width="19" height="2.8" rx="0.4" fill="#e5dcc8" stroke={INK} strokeWidth="0.55" />
          <path
            d="M8 24.5 Q10 21.8 12 24.5 Q14 21.5 16 24.5 Q18 21.5 20 24.5 Q22 21.8 24 24.5 Z"
            fill="#e5b95c"
            stroke={INK}
            strokeWidth="0.5"
          />
          {/* 大佛盤腿與身軀剪影 */}
          <path
            d="M8.4 23.4 C8.2 20.6 10.6 19 11.4 17.8 C11.8 15.6 12.6 13.8 14.2 13.2 H17.8 C19.4 13.8 20.2 15.6 20.6 17.8 C21.4 19 23.8 20.6 23.6 23.4 Z"
            fill="#4a403a"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 袈裟衣紋與禪定手印 */}
          <path d="M12.5 14.2 Q16 17.8 19.6 16.2" fill="none" stroke="#857468" strokeWidth="0.6" />
          <ellipse cx="16" cy="20.4" rx="2.6" ry="1.1" fill="#62544b" stroke="#857468" strokeWidth="0.45" />
          {/* 佛首與肉髻 */}
          <circle cx="16" cy="9.6" r="3.2" fill="#4a403a" stroke={INK} strokeWidth="0.6" />
          <circle cx="16" cy="6.2" r="1.45" fill="#4a403a" stroke={INK} strokeWidth="0.5" />
          {/* 雙耳 */}
          <ellipse cx="12.5" cy="9.9" rx="0.65" ry="1.5" fill="#4a403a" />
          <ellipse cx="19.5" cy="9.9" rx="0.65" ry="1.5" fill="#4a403a" />
          {/* 額間白毫金點 */}
          <circle cx="16" cy="9.1" r="0.45" fill="#f6d884" />
        </g>
      );

    /* 10. 南投：日月潭慈恩塔 — 湖光山色間的修長寶塔 */
    case 'nantou':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 遠山 */}
          <path d="M3 25.5 L9.5 17.5 L15.5 23 L22.5 16.8 L29 25.5 Z" fill="#669672" opacity="0.65" stroke="#4d7c5b" strokeWidth="0.5" />
          {/* 日月潭湖面 */}
          <ellipse cx="16" cy="26.8" rx="13" ry="2.4" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.5" />
          <path d="M8.5 27.2 Q12.5 26.5 16.5 27.2 T24 27.2" stroke="#eef7f8" strokeWidth="0.55" fill="none" />
          {/* 慈恩塔基座 */}
          <rect x="11.5" y="23.2" width="9" height="2.6" fill="#e5dcc8" stroke={INK} strokeWidth="0.55" />
          {/* 塔身五重白牆與朱金飛檐 */}
          {[
            { y: 20.2, w: 6.4, ew: 10.6 },
            { y: 16.8, w: 5.6, ew: 9.4 },
            { y: 13.6, w: 4.8, ew: 8.2 },
            { y: 10.6, w: 4.0, ew: 7.0 },
            { y: 7.8, w: 3.2, ew: 5.8 },
          ].map((tier, idx) => (
            <g key={idx}>
              <rect
                x={16 - tier.w / 2}
                y={tier.y}
                width={tier.w}
                height="3"
                fill="#f5efe2"
                stroke={INK}
                strokeWidth="0.45"
              />
              <path
                d={`M${16 - tier.ew / 2} ${tier.y + 0.5} Q16 ${tier.y - 1.4} ${16 + tier.ew / 2} ${tier.y + 0.5} L${16 + tier.w / 2} ${tier.y - 0.8} H${16 - tier.w / 2} Z`}
                fill="#c43e2e"
                stroke={INK}
                strokeWidth="0.45"
              />
            </g>
          ))}
          {/* 塔頂金剎 */}
          <path d="M13.6 7.4 L16 4.4 L18.4 7.4 Z" fill="#e5b95c" stroke={INK} strokeWidth="0.5" />
          <line x1="16" y1="2.2" x2="16" y2="4.6" stroke="#c99634" strokeWidth="0.85" />
        </g>
      );

    /* 11. 雲林：西螺大橋 — 朱紅華倫式鋼桁拱橋 */
    case 'yunlin':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 濁水溪河面 */}
          <rect x="2.5" y="23.8" width="27" height="4.2" rx="2" fill="#7db8c2" stroke="#4a8594" strokeWidth="0.5" />
          <path d="M5.5 26 Q9.5 25.2 13.5 26 T21.5 26 T27 26" stroke="#eef7f8" strokeWidth="0.6" fill="none" />
          {/* 橋墩 */}
          <rect x="4.5" y="20.6" width="2.4" height="5" fill="#dcd3c1" stroke={INK} strokeWidth="0.5" />
          <rect x="14.8" y="20.6" width="2.4" height="5" fill="#dcd3c1" stroke={INK} strokeWidth="0.5" />
          <rect x="25.1" y="20.6" width="2.4" height="5" fill="#dcd3c1" stroke={INK} strokeWidth="0.5" />
          {/* 紅色鋼桁雙拱與斜撐 */}
          <g fill="none" stroke="#c43e2e" strokeWidth="1.2">
            {/* 左拱 */}
            <path d="M4.5 20.6 Q10.2 10.2 16 20.6" />
            {/* 右拱 */}
            <path d="M16 20.6 Q21.8 10.2 27.5 20.6" />
          </g>
          {/* 桁架細格斜桿 */}
          <g stroke="#d64e3a" strokeWidth="0.7" fill="none">
            <path d="M6.8 20.4 L8.4 16.4 L10.2 20.4 L12 16.4 L13.8 20.4" />
            <path d="M18.2 20.4 L20 16.4 L21.8 20.4 L23.6 16.4 L25.4 20.4" />
            <line x1="10.2" y1="15.4" x2="10.2" y2="20.4" />
            <line x1="21.8" y1="15.4" x2="21.8" y2="20.4" />
          </g>
          {/* 橋面主梁 */}
          <rect x="2.5" y="20" width="27" height="1.5" rx="0.3" fill="#b94a38" stroke={INK} strokeWidth="0.5" />
        </g>
      );

    /* 12. 嘉義市：北門驛木造車站 — 日式檜木驛站與森鐵火車頭 */
    case 'chiayi_city':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.1" fill="#2c2218" opacity="0.22" />
          {/* 鐵軌枕木 */}
          <line x1="3.5" y1="26.8" x2="28.5" y2="26.8" stroke="#62544b" strokeWidth="1" />
          {/* 檜木車站主體 */}
          <rect x="4.5" y="16.5" width="18.5" height="9.6" rx="0.4" fill="#d4b483" stroke={INK} strokeWidth="0.6" />
          {/* 木牆橫板紋理 */}
          <line x1="5" y1="19.5" x2="22.5" y2="19.5" stroke="#a68352" strokeWidth="0.45" />
          <line x1="5" y1="22.8" x2="22.5" y2="22.8" stroke="#a68352" strokeWidth="0.45" />
          {/* 黑瓦斜屋頂與入口三角山牆 */}
          <path d="M3.2 17 L6.5 11.4 H21 L24.2 17 Z" fill="#5e5752" stroke={INK} strokeWidth="0.6" />
          <path d="M9.6 17.4 L13.8 12.4 L18 17.4 Z" fill="#e5dcc8" stroke={INK} strokeWidth="0.55" />
          <path d="M9 17.4 L13.8 11.8 L18.6 17.4" fill="none" stroke="#47362b" strokeWidth="0.9" />
          {/* 溫暖車廂與車站窗戶 */}
          <rect x="6.5" y="19.8" width="2.8" height="3.2" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          <rect x="12.1" y="20" width="3.4" height="6" fill="#6b4430" stroke="#f5efe2" strokeWidth="0.45" />
          <rect x="18.2" y="19.8" width="2.8" height="3.2" fill="#f6d884" stroke={INK} strokeWidth="0.45" />
          {/* 右側紅色林鐵小火車頭 */}
          <rect x="21.5" y="20" width="7.2" height="6.2" rx="0.8" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="22.6" y="21.2" width="4.8" height="2" rx="0.3" fill="#f6d884" />
          <circle cx="25" cy="24.6" r="0.8" fill="#fff6db" stroke={INK} strokeWidth="0.35" />
        </g>
      );

    /* 13. 嘉義縣：阿里山神木與小火車 — 巨檜、櫻花與紅皮小火車 */
    case 'chiayi_county':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.1" fill="#2c2218" opacity="0.22" />
          {/* 山坡綠嶺 */}
          <path d="M3 27.5 Q12 21.5 29 24.8 V27.5 Z" fill="#5c8c67" stroke={INK} strokeWidth="0.5" />
          {/* 左側阿里山神木 */}
          <path d="M7.8 26.2 L8.8 14.5 H12.2 L13.4 26.2 Z" fill="#8b5a3c" stroke={INK} strokeWidth="0.6" />
          <ellipse cx="10.5" cy="13.5" rx="5.5" ry="3.4" fill="#386045" stroke={INK} strokeWidth="0.55" />
          <ellipse cx="10.5" cy="9.2" rx="4.5" ry="3" fill="#4d7c5b" stroke={INK} strokeWidth="0.5" />
          <ellipse cx="10.5" cy="5.8" rx="3.2" ry="2.2" fill="#669672" stroke={INK} strokeWidth="0.5" />
          {/* 點綴山櫻花粉紅 */}
          <circle cx="6.2" cy="14.5" r="1.1" fill="#f2a7b3" />
          <circle cx="14.6" cy="11.8" r="1" fill="#f2a7b3" />
          {/* 蒸汽白煙 */}
          <circle cx="19.5" cy="15.2" r="1.4" fill="#f5efe2" opacity="0.85" />
          <circle cx="21.5" cy="13.2" r="1.8" fill="#f5efe2" opacity="0.72" />
          {/* 阿里山紅色森林小火車 */}
          <rect x="15.2" y="18.6" width="13.2" height="5.6" rx="0.9" fill="#c43e2e" stroke={INK} strokeWidth="0.6" />
          <rect x="17.2" y="16.4" width="2.2" height="2.4" fill="#47362b" />
          {/* 車身金線與車窗 */}
          <line x1="15.5" y1="22.4" x2="28.1" y2="22.4" stroke="#f6d884" strokeWidth="0.9" />
          <rect x="16.8" y="19.8" width="2.4" height="1.8" rx="0.2" fill="#fff6db" />
          <rect x="20.4" y="19.8" width="2.4" height="1.8" rx="0.2" fill="#fff6db" />
          <rect x="24" y="19.8" width="2.8" height="1.8" rx="0.2" fill="#fff6db" />
          {/* 車輪 */}
          <circle cx="17.8" cy="24.8" r="1.1" fill="#3e2723" />
          <circle cx="22" cy="24.8" r="1.1" fill="#3e2723" />
          <circle cx="26" cy="24.8" r="1.1" fill="#3e2723" />
        </g>
      );

    /* 14. 台南：赤崁樓 — 重檐翹脊朱紅燕尾閣樓、白石高台與暖光門廊 */
    case 'tainan':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28.4" rx="13.5" ry="2.2" fill="#2c2218" opacity="0.24" />
          {/* 白色石砌高台基座 */}
          <path d="M4 27.6 L5.2 21.6 H26.8 L28 27.6 Z" fill="#f5efe2" stroke={INK} strokeWidth="0.6" />
          {/* 高台石牆紅磚護欄與石縫 */}
          <rect x="4.8" y="21.1" width="22.4" height="1.4" fill="#c85a44" stroke={INK} strokeWidth="0.45" />
          <line x1="4.8" y1="24.6" x2="27.2" y2="24.6" stroke="#c7bca6" strokeWidth="0.5" />
          {/* 台階中門 */}
          <path d="M13.6 27.6 V24.4 A2.4 2.4 0 0 1 18.4 24.4 V27.6 Z" fill="#c7bca6" stroke={INK} strokeWidth="0.5" />
          {/* 一樓紅磚朱柱廊廡 */}
          <rect x="7.4" y="15.8" width="17.2" height="5.4" fill="#b94a38" stroke={INK} strokeWidth="0.55" />
          {/* 溫暖發光燈籠門廊 */}
          <rect x="13.8" y="16.8" width="4.4" height="4.4" rx="0.4" fill="#f6d884" stroke="#8e3224" strokeWidth="0.5" />
          <circle cx="16" cy="18.2" r="1" fill="#fff6db" />
          <line x1="10.2" y1="16" x2="10.2" y2="21.2" stroke="#f5efe2" strokeWidth="0.65" opacity="0.8" />
          <line x1="21.8" y1="16" x2="21.8" y2="21.2" stroke="#f5efe2" strokeWidth="0.65" opacity="0.8" />
          {/* 下層寬闊朱紅燕尾翹脊屋頂 */}
          <path
            d="M3.6 15.8 C5.5 15.6 7.5 14.2 8.8 13 H23.2 C24.5 14.2 26.5 15.6 28.4 15.8 L25.6 16.7 H6.4 Z"
            fill="#c43e2e"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M4.2 15.6 Q16 14.8 27.8 15.6" fill="none" stroke="#e5b95c" strokeWidth="0.65" />
          {/* 二樓閣樓朱牆 */}
          <rect x="9.8" y="9.8" width="12.4" height="3.4" fill="#b94a38" stroke={INK} strokeWidth="0.55" />
          <rect x="14.5" y="10.4" width="3" height="2.2" fill="#f6d884" stroke={INK} strokeWidth="0.35" />
          {/* 上層經典大幅度上翹朱紅燕尾屋頂 */}
          <path
            d="M5.8 9.9 C8 9.6 10.2 7.8 11.8 6.2 Q16 7.1 20.2 6.2 C21.8 7.8 24 9.6 26.2 9.9 L23.4 10.8 H8.6 Z"
            fill="#d64e3a"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 燕尾金脊與寶珠 */}
          <path d="M10.4 5.5 Q16 7 21.6 5.5" fill="none" stroke="#f6d884" strokeWidth="1" />
          <circle cx="16" cy="5.7" r="0.7" fill="#e5b95c" stroke={INK} strokeWidth="0.35" />
        </g>
      );

    /* 15. 高雄：打狗英國領事館 — 山丘紅磚圓拱迴廊與港灣 */
    case 'kaohsiung':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 港灣海水 */}
          <ellipse cx="16" cy="27.2" rx="13" ry="2.2" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.5" />
          {/* 哨船頭綠丘與石階 */}
          <path d="M3.5 26.2 Q16 19.8 28.5 26.2 Z" fill="#5c8c67" stroke={INK} strokeWidth="0.55" />
          <rect x="6.2" y="21.4" width="19.6" height="1.8" fill="#e5dcc8" stroke={INK} strokeWidth="0.5" />
          {/* 紅磚洋樓主體 */}
          <rect x="6.8" y="12.4" width="18.4" height="9.2" rx="0.4" fill="#b94a38" stroke={INK} strokeWidth="0.6" />
          {/* 經典連續四圓拱迴廊 */}
          {[8.2, 12.1, 16, 19.9].map((ax, idx) => (
            <path
              key={idx}
              d={`M${ax} 21.4 V16.4 A1.45 1.45 0 0 1 ${ax + 2.9} 16.4 V21.4 Z`}
              fill="#5e3a29"
              stroke="#e5dcc8"
              strokeWidth="0.45"
            />
          ))}
          {/* 迴廊白色欄杆 */}
          <line x1="7.2" y1="19.8" x2="24.8" y2="19.8" stroke="#f5efe2" strokeWidth="0.7" />
          {/* 斜瓦屋頂與雙煙囪 */}
          <rect x="9.5" y="7.5" width="2" height="3.2" fill="#b94a38" stroke={INK} strokeWidth="0.45" />
          <rect x="20.5" y="7.5" width="2" height="3.2" fill="#b94a38" stroke={INK} strokeWidth="0.45" />
          <path d="M5.6 12.6 L8.8 9.2 H23.2 L26.4 12.6 Z" fill="#6b5e54" stroke={INK} strokeWidth="0.6" />
        </g>
      );

    /* 16. 屏東：鵝鑾鼻燈塔 — 純白武裝燈塔與雙向金色光芒 */
    case 'pingtung':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 雙向金色探照光束 */}
          <path d="M16 7.5 L2.5 3.8 L2.5 11.4 Z" fill="#f6d884" opacity="0.45" />
          <path d="M16 7.5 L29.5 3.8 L29.5 11.4 Z" fill="#f6d884" opacity="0.45" />
          {/* 熱帶海浪與綠岬 */}
          <ellipse cx="16" cy="27.2" rx="13" ry="2.2" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.5" />
          <path d="M4.5 26.2 Q16 22.6 27.5 26.2 Z" fill="#669672" stroke={INK} strokeWidth="0.5" />
          {/* 燈塔白色圍牆基座 */}
          <rect x="8.8" y="21.4" width="14.4" height="3.4" rx="0.4" fill="#f5efe2" stroke={INK} strokeWidth="0.55" />
          {/* 高聳純白圓柱塔身 */}
          <path d="M12.4 21.8 L13.4 9.2 H18.6 L19.6 21.8 Z" fill="#faf6ec" stroke={INK} strokeWidth="0.6" />
          {/* 觀景平台與燈室 */}
          <rect x="12.2" y="8.8" width="7.6" height="1.2" rx="0.3" fill="#e5dcc8" stroke={INK} strokeWidth="0.45" />
          <rect x="13.6" y="6" width="4.8" height="2.8" fill="#f6d884" stroke={INK} strokeWidth="0.55" />
          <path d="M13 6.2 Q16 3.2 19 6.2 Z" fill="#47362b" stroke={INK} strokeWidth="0.5" />
          <circle cx="16" cy="7.4" r="1.1" fill="#fff6db" />
        </g>
      );

    /* 17. 宜蘭：龜山島 — 太平洋碧波上的靈龜火山島影 */
    case 'yilan':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 太平洋海面 */}
          <ellipse cx="16" cy="25.6" rx="13.5" ry="3.2" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.55" />
          {/* 龜甲高聳火山主峰 */}
          <path
            d="M4.2 23.6 C5.2 19 7.8 11.4 13.4 10.6 C17.6 10 20 14.2 21.8 18.4 C23.4 17 25.8 16.4 27.4 18.2 C28.4 19.4 28.4 21.8 27.8 23.6 Z"
            fill="#4d7c5b"
            stroke={INK}
            strokeWidth="0.65"
          />
          {/* 陽光面翠綠與岩壁層次 */}
          <path
            d="M6.4 23.4 C7.4 18.8 9.6 12.6 13.4 11.4 C15.8 11.2 17.4 15.2 18.2 23.4 Z"
            fill="#669672"
            opacity="0.75"
          />
          {/* 龜首高光 */}
          <path d="M22.2 19.2 Q25 17.4 26.8 19.2" fill="none" stroke="#85b58f" strokeWidth="0.8" />
          {/* 海浪白沫 */}
          <path
            d="M3.5 24.4 Q7.5 23 11.5 24.4 T19.5 24.4 T28.5 24.4"
            fill="none"
            stroke="#eef7f8"
            strokeWidth="1.1"
          />
          <path d="M8.5 26.8 Q12.5 25.9 16.5 26.8 T24 26.8" fill="none" stroke="#eef7f8" strokeWidth="0.65" opacity="0.8" />
        </g>
      );

    /* 18. 花蓮：太魯閣牌樓 — 大理石峽谷峭壁與東西橫貫朱金牌樓 */
    case 'hualien':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 峽谷溪流 */}
          <ellipse cx="16" cy="27.4" rx="11.5" ry="2" fill="#7db8c2" opacity="0.75" />
          {/* 左右大理石峽谷峭壁 */}
          <path d="M2.2 27.2 L3.4 8.5 L8.6 5.2 L10.2 15.5 L8.2 27.2 Z" fill="#dcd6cc" stroke={INK} strokeWidth="0.6" />
          <path d="M29.8 27.2 L28.6 9.2 L23.4 5.8 L21.8 15.5 L23.8 27.2 Z" fill="#cfc8bc" stroke={INK} strokeWidth="0.6" />
          {/* 峭壁折面紋理 */}
          <path d="M5.8 11 L7.4 19 M26.2 11.5 L24.6 19.5" stroke="#9e9689" strokeWidth="0.6" />
          {/* 朱紅牌樓四柱與橫樑 */}
          <g stroke="#c43e2e" strokeWidth="1.35">
            <line x1="8.8" y1="15.8" x2="8.8" y2="27" />
            <line x1="13.2" y1="13.2" x2="13.2" y2="27" />
            <line x1="18.8" y1="13.2" x2="18.8" y2="27" />
            <line x1="23.2" y1="15.8" x2="23.2" y2="27" />
          </g>
          {/* 牌樓中央橫匾 */}
          <rect x="12.4" y="13.4" width="7.2" height="2.4" fill="#c43e2e" stroke="#e5b95c" strokeWidth="0.5" />
          <line x1="13.6" y1="14.6" x2="18.4" y2="14.6" stroke="#f6d884" strokeWidth="0.65" />
          {/* 左右翼檐與中央主飛檐 */}
          <path d="M6.6 16.4 Q10.2 14.8 13 16.4 L12.2 14.8 H7.6 Z" fill="#e5b95c" stroke={INK} strokeWidth="0.5" />
          <path d="M19 16.4 Q21.8 14.8 25.4 16.4 L24.4 14.8 H19.8 Z" fill="#e5b95c" stroke={INK} strokeWidth="0.5" />
          <path d="M10.4 13.2 Q16 10.6 21.6 13.2 L19.8 10.6 H12.2 Z" fill="#d64e3a" stroke={INK} strokeWidth="0.55" />
          <path d="M11.6 10.5 Q16 11.4 20.4 10.5" fill="none" stroke="#f6d884" strokeWidth="0.8" />
        </g>
      );

    /* 19. 台東：三仙台八拱橋 — 跨海波浪形連續拱橋與礁岩 */
    case 'taitung':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 太平洋碧藍海面 */}
          <ellipse cx="16" cy="25.6" rx="13.5" ry="3" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.55" />
          {/* 兩岸火山礁岩 */}
          <path d="M2.5 24.8 L4.4 18.8 L7.4 21.4 L8 24.8 Z" fill="#7a756b" stroke={INK} strokeWidth="0.55" />
          <path d="M24 24.8 L25.6 20 L28.2 17.8 L29.5 24.8 Z" fill="#7a756b" stroke={INK} strokeWidth="0.55" />
          {/* 經典起伏波浪形多拱橋身 */}
          <path
            d="M5.6 23.6 Q7.6 17.2 9.6 23.6 Q11.8 14.2 14 23.6 Q16.2 11.4 18.4 23.6 Q20.6 14.4 22.8 23.6 Q24.8 17.4 26.8 23.6"
            fill="none"
            stroke="#f5efe2"
            strokeWidth="2.1"
          />
          <path
            d="M5.6 23.6 Q7.6 17.2 9.6 23.6 Q11.8 14.2 14 23.6 Q16.2 11.4 18.4 23.6 Q20.6 14.4 22.8 23.6 Q24.8 17.4 26.8 23.6"
            fill="none"
            stroke="#c85a44"
            strokeWidth="0.95"
          />
          {/* 海面浪花 */}
          <path d="M4.5 25.4 Q8.5 24.3 12.5 25.4 T20.5 25.4 T27.5 25.4" fill="none" stroke="#eef7f8" strokeWidth="0.8" />
        </g>
      );

    /* 20. 澎湖：雙心石滬 — 碧藍礁湖中的玄武岩雙心石滬 */
    case 'penghu':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="27.6" rx="12" ry="2.2" fill="#2c2218" opacity="0.18" />
          {/* 澄澈翡翠潟湖 */}
          <ellipse cx="16" cy="16.4" rx="12.8" ry="10.8" fill="#88c2cc" stroke="#4a8594" strokeWidth="0.65" />
          <ellipse cx="16" cy="16.4" rx="10.2" ry="8.4" fill="#6ca9b5" opacity="0.65" />
          {/* 外圈大心玄武岩石滬（附白沫描邊） */}
          <path
            d="M16 24.2 C10.4 20.2 6.8 16.4 6.8 12.6 C6.8 9.8 9.2 8 11.8 8 C13.8 8 15.2 9.2 16 10.6 C16.8 9.2 18.2 8 20.2 8 C22.8 8 25.2 9.8 25.2 12.6 C25.2 16.4 21.6 20.2 16 24.2 Z"
            fill="none"
            stroke="#eef7f8"
            strokeWidth="2.4"
            opacity="0.7"
          />
          <path
            d="M16 24.2 C10.4 20.2 6.8 16.4 6.8 12.6 C6.8 9.8 9.2 8 11.8 8 C13.8 8 15.2 9.2 16 10.6 C16.8 9.2 18.2 8 20.2 8 C22.8 8 25.2 9.8 25.2 12.6 C25.2 16.4 21.6 20.2 16 24.2 Z"
            fill="none"
            stroke="#4a403a"
            strokeWidth="1.35"
          />
          {/* 內圈小心玄武岩石滬 */}
          <path
            d="M16 20.4 C12.6 18 10.6 15.8 10.6 13.6 C10.6 12 12 11 13.5 11 C14.7 11 15.5 11.8 16 12.6 C16.5 11.8 17.3 11 18.5 11 C20 11 21.4 12 21.4 13.6 C21.4 15.8 19.4 18 16 20.4 Z"
            fill="none"
            stroke="#eef7f8"
            strokeWidth="1.9"
            opacity="0.7"
          />
          <path
            d="M16 20.4 C12.6 18 10.6 15.8 10.6 13.6 C10.6 12 12 11 13.5 11 C14.7 11 15.5 11.8 16 12.6 C16.5 11.8 17.3 11 18.5 11 C20 11 21.4 12 21.4 13.6 C21.4 15.8 19.4 18 16 20.4 Z"
            fill="none"
            stroke="#4a403a"
            strokeWidth="1.15"
          />
          {/* 伸向岸邊的滬手 */}
          <path d="M5.2 11 Q6.8 12.2 8.2 12.2 M26.8 11 Q25.2 12.2 23.8 12.2" stroke="#4a403a" strokeWidth="1" fill="none" />
        </g>
      );

    /* 21. 金門：莒光樓 — 三層古典樓閣、碧玉金瓦與朱紅柱廊 */
    case 'kinmen':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28.2" rx="13" ry="2.1" fill="#2c2218" opacity="0.22" />
          {/* 白色石階台基 */}
          <rect x="4.5" y="24.2" width="23" height="3.2" rx="0.4" fill="#f5efe2" stroke={INK} strokeWidth="0.55" />
          <rect x="13" y="24.2" width="6" height="3.2" fill="#dcd3c1" stroke={INK} strokeWidth="0.45" />
          {/* 一樓左右對稱朱柱與白牆 */}
          <rect x="6.5" y="18.2" width="19" height="6" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="8.2" y="19.6" width="2.4" height="3.2" fill="#f5efe2" />
          <rect x="21.4" y="19.6" width="2.4" height="3.2" fill="#f5efe2" />
          <rect x="14.2" y="19.4" width="3.6" height="4.8" fill="#5e3a29" stroke="#f6d884" strokeWidth="0.45" />
          {/* 一樓碧綠琉璃瓦飛檐 */}
          <path d="M4.6 18.6 Q16 16.4 27.4 18.6 L25 16.4 H7 Z" fill="#4d7c5b" stroke={INK} strokeWidth="0.55" />
          {/* 二樓閣身與金色「莒光」牌匾 */}
          <rect x="9.5" y="12.2" width="13" height="4.4" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="14.4" y="12.7" width="3.2" height="3.2" fill="#e5b95c" stroke={INK} strokeWidth="0.4" />
          {/* 二樓琉璃瓦檐 */}
          <path d="M7.6 12.6 Q16 10.6 24.4 12.6 L22 10.6 H10 Z" fill="#4d7c5b" stroke={INK} strokeWidth="0.55" />
          {/* 三樓頂閣與金頂 */}
          <rect x="12" y="8.4" width="8" height="2.4" fill="#f5efe2" stroke={INK} strokeWidth="0.45" />
          <path d="M10.4 8.6 L16 4.4 L21.6 8.6 Z" fill="#386045" stroke={INK} strokeWidth="0.55" />
          <path d="M10.6 8.5 Q16 7.8 21.4 8.5" fill="none" stroke="#f6d884" strokeWidth="0.7" />
          <circle cx="16" cy="3.8" r="0.85" fill="#e5b95c" stroke={INK} strokeWidth="0.4" />
        </g>
      );

    /* 22. 連江（馬祖）：東引島燈塔 — 懸崖純白歐式燈塔與紅瓦守塔屋 */
    case 'lienchiang':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 東海藍波 */}
          <ellipse cx="16" cy="27.2" rx="13" ry="2.2" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.5" />
          {/* 陡峭花崗岩海崖 */}
          <path d="M4.2 26.4 L7 18.8 L14.5 17.6 L22.5 18.4 L27.6 26.4 Z" fill="#9e9689" stroke={INK} strokeWidth="0.6" />
          <path d="M7 18.8 L14.5 17.6 L19.5 19.8 L12 20.6 Z" fill="#669672" opacity="0.8" />
          {/* 崖邊歐式白牆紅瓦守塔小屋 */}
          <rect x="7.8" y="15.2" width="6.2" height="4.4" fill="#f5efe2" stroke={INK} strokeWidth="0.5" />
          <path d="M7 15.4 L10.9 12.6 L14.8 15.4 Z" fill="#c85a44" stroke={INK} strokeWidth="0.5" />
          <rect x="9.6" y="16.8" width="1.6" height="2" fill="#f6d884" />
          {/* 崖頂純白圓柱燈塔 */}
          <path d="M15.2 19.2 L16 8.8 H20.4 L21.2 19.2 Z" fill="#faf6ec" stroke={INK} strokeWidth="0.6" />
          <rect x="15" y="8.4" width="6.4" height="1.1" rx="0.2" fill="#e5dcc8" stroke={INK} strokeWidth="0.45" />
          {/* 黑色圓頂與暖金燈光 */}
          <rect x="16.2" y="6" width="4" height="2.4" fill="#f6d884" stroke={INK} strokeWidth="0.5" />
          <path d="M15.6 6.2 Q18.2 3.5 20.8 6.2 Z" fill="#47362b" stroke={INK} strokeWidth="0.5" />
          {/* 右上微光閃耀 */}
          <path d="M20.4 7.2 L28 4.4 L28 10 Z" fill="#f6d884" opacity="0.38" />
        </g>
      );

    /* 23. 寧德：太姥山關隘 — 花崗岩雙峰雲霧與石砌雄關隘口 */
    case 'ningde':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28" rx="13" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 左右花崗岩奇峰（太姥雙峰） */}
          <path
            d="M2.5 27.2 L5.2 12.2 L8.8 5.4 L12.4 12.8 L14.5 27.2 Z"
            fill="#cfc8bc"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M8.8 5.4 L11.4 13.2 L12.8 26.8 H8.6 Z" fill="#9e9689" opacity="0.55" />
          <path
            d="M17.5 27.2 L19.8 11.4 L23.4 4.4 L27.2 11.8 L29.5 27.2 Z"
            fill="#dcd6cc"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M23.4 4.4 L26 12.4 L27.8 26.8 H23.2 Z" fill="#9e9689" opacity="0.55" />
          {/* 蒼翠山麓松林 */}
          <path d="M3 27.2 Q8 22.8 12.5 27.2 Z" fill="#4d7c5b" stroke={INK} strokeWidth="0.45" />
          <path d="M19.5 27.2 Q24.5 22.4 29 27.2 Z" fill="#4d7c5b" stroke={INK} strokeWidth="0.45" />
          {/* 隘口石砌關牆與垛口 */}
          <path d="M9.2 27.2 L10.2 18.6 H21.8 L22.8 27.2 Z" fill="#e5dcc8" stroke={INK} strokeWidth="0.6" />
          <path
            d="M9.6 18.6 V16.9 H11.6 V17.9 H13.4 V16.9 H15.4 V17.9 H16.6 V16.9 H18.6 V17.9 H20.4 V16.9 H22.4 V18.6 Z"
            fill="#dcd3c1"
            stroke={INK}
            strokeWidth="0.5"
          />
          {/* 石砌拱形關門洞 */}
          <path d="M13.6 27.2 V22.6 A2.4 2.4 0 0 1 18.4 22.6 V27.2 Z" fill="#523b2e" stroke="#8b5a3c" strokeWidth="0.55" />
          {/* 關樓小檐哨亭 */}
          <rect x="13.2" y="14.4" width="5.6" height="2.6" fill="#b94a38" stroke={INK} strokeWidth="0.45" />
          <path d="M11.6 14.7 Q16 12.6 20.4 14.7 L18.8 13 H13.2 Z" fill="#6b5e54" stroke={INK} strokeWidth="0.5" />
          {/* 山間縹緲白霧 */}
          <path d="M3.6 15.8 Q8.2 14.4 12.2 15.8" stroke="#f5efe2" strokeWidth="1.5" fill="none" opacity="0.82" />
          <path d="M19.8 14.4 Q24 13.1 28.4 14.4" stroke="#f5efe2" strokeWidth="1.5" fill="none" opacity="0.82" />
        </g>
      );

    /* 24. 福州：福州鎮海樓 — 宏偉朱柱重檐臨海望樓與石砌城台 */
    case 'fuzhou':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28.2" rx="13.4" ry="2.2" fill="#2c2218" opacity="0.24" />
          {/* 屏山石砌高台城座 */}
          <path d="M4.2 27.5 L5.8 20.8 H26.2 L27.8 27.5 Z" fill="#dcd3c1" stroke={INK} strokeWidth="0.6" />
          <line x1="5.2" y1="24.2" x2="26.8" y2="24.2" stroke="#a69a86" strokeWidth="0.45" />
          <rect x="5.4" y="19.8" width="21.2" height="1.3" fill="#e5dcc8" stroke={INK} strokeWidth="0.45" />
          {/* 城座中央石拱門 */}
          <path d="M13.6 27.5 V23.4 A2.4 2.4 0 0 1 18.4 23.4 V27.5 Z" fill="#523b2e" stroke="#b94a38" strokeWidth="0.55" />
          {/* 一樓朱紅柱廊 */}
          <rect x="7.4" y="14.6" width="17.2" height="5.2" fill="#b94a38" stroke={INK} strokeWidth="0.55" />
          <g stroke="#f5efe2" strokeWidth="0.7" opacity="0.85">
            <line x1="9.8" y1="14.8" x2="9.8" y2="19.6" />
            <line x1="12.6" y1="14.8" x2="12.6" y2="19.6" />
            <line x1="19.4" y1="14.8" x2="19.4" y2="19.6" />
            <line x1="22.2" y1="14.8" x2="22.2" y2="19.6" />
          </g>
          <rect x="14.2" y="15.6" width="3.6" height="4.2" fill="#f6d884" stroke="#8e3224" strokeWidth="0.45" />
          {/* 下層朱紅重檐飛翹 */}
          <path
            d="M3.8 15.2 Q16 12.8 28.2 15.2 L25.4 12.6 H6.6 Z"
            fill="#c43e2e"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M4.6 15 Q16 14 27.4 15" fill="none" stroke="#e5b95c" strokeWidth="0.6" />
          {/* 二樓望海閣樓與「鎮海樓」金匾 */}
          <rect x="9.6" y="8.8" width="12.8" height="3.8" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="13.8" y="9.5" width="4.4" height="2.2" fill="#e5b95c" stroke={INK} strokeWidth="0.4" />
          {/* 上層歇山重檐大屋頂與金脊 */}
          <path
            d="M5.6 9.2 Q16 6.4 26.4 9.2 L22.2 5.4 Q16 6.2 9.8 5.4 Z"
            fill="#d64e3a"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M9.2 5.2 Q16 6.3 22.8 5.2" fill="none" stroke="#f6d884" strokeWidth="0.95" />
          <circle cx="16" cy="4.4" r="0.75" fill="#e5b95c" stroke={INK} strokeWidth="0.35" />
        </g>
      );

    /* 25. 莆田：湄洲媽祖祖廟 — 臨海閩南燕尾祖廟與慈航金光 */
    case 'putian':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 媽祖庇佑金色慈光圓暈 */}
          <circle cx="16" cy="11.5" r="7.4" fill="#f6d884" opacity="0.36" />
          <circle cx="16" cy="11.5" r="4.8" fill="#fff6db" opacity="0.4" />
          {/* 湄洲海面碧波 */}
          <ellipse cx="16" cy="26.8" rx="13.2" ry="2.5" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.5" />
          <path d="M6.5 27.2 Q11 26.2 15.5 27.2 T25 27.2" fill="none" stroke="#eef7f8" strokeWidth="0.65" />
          {/* 濱海石階廟埕 */}
          <path d="M5 25.4 L6.4 22.4 H25.6 L27 25.4 Z" fill="#e5dcc8" stroke={INK} strokeWidth="0.55" />
          <rect x="13.4" y="22.4" width="5.2" height="3" fill="#dcd3c1" stroke={INK} strokeWidth="0.4" />
          {/* 祖廟朱紅殿堂與暖金神龕門 */}
          <rect x="7.8" y="16.2" width="16.4" height="6.2" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          <rect x="9.4" y="17.8" width="2.2" height="3" fill="#f5efe2" stroke={INK} strokeWidth="0.35" />
          <rect x="20.4" y="17.8" width="2.2" height="3" fill="#f5efe2" stroke={INK} strokeWidth="0.35" />
          <path d="M13.8 22.4 V18.6 A2.2 2.2 0 0 1 18.2 18.6 V22.4 Z" fill="#f6d884" stroke="#8e3224" strokeWidth="0.5" />
          <circle cx="16" cy="19.6" r="0.9" fill="#fff6db" />
          {/* 下層閩南燕尾飛檐 */}
          <path
            d="M4 16.4 C6.4 16 8.2 14.4 9.6 13.4 H22.4 C23.8 14.4 25.6 16 28 16.4 L25.2 17.2 H6.8 Z"
            fill="#d64e3a"
            stroke={INK}
            strokeWidth="0.55"
          />
          {/* 上層高翹雙龍燕尾正脊 */}
          <rect x="10.8" y="10.8" width="10.4" height="2.6" fill="#b94a38" stroke={INK} strokeWidth="0.5" />
          <path
            d="M6.4 11 C8.8 10.6 10.8 8.6 12.2 7.2 Q16 8.2 19.8 7.2 C21.2 8.6 23.2 10.6 25.6 11 L22.8 11.8 H9.2 Z"
            fill="#c43e2e"
            stroke={INK}
            strokeWidth="0.6"
          />
          {/* 金色雙翹脊飾與寶珠 */}
          <path d="M9.6 6.4 Q16 8.4 22.4 6.4" fill="none" stroke="#e5b95c" strokeWidth="1" />
          <circle cx="16" cy="6.6" r="0.85" fill="#f6d884" stroke={INK} strokeWidth="0.35" />
        </g>
      );

    /* 26. 泉州：開元寺東西塔 — 鎮國、仁壽雙八角花崗石塔 */
    case 'quanzhou':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28.2" rx="13.2" ry="2.1" fill="#2c2218" opacity="0.22" />
          {/* 寺院石台與中央紫雲古樹、山門 */}
          <rect x="3.8" y="25.2" width="24.4" height="2.4" rx="0.4" fill="#dcd3c1" stroke={INK} strokeWidth="0.55" />
          <circle cx="16" cy="22.8" r="2.6" fill="#4d7c5b" stroke={INK} strokeWidth="0.45" />
          <rect x="13.8" y="23.4" width="4.4" height="2" fill="#c43e2e" stroke={INK} strokeWidth="0.4" />
          {/* 雙八角石塔（東塔與西塔） */}
          {[9.2, 22.8].map((cx, towerIdx) => (
            <g key={towerIdx}>
              {/* 塔座須彌座 */}
              <rect x={cx - 3.6} y="23.2" width="7.2" height="2.2" fill="#e5dcc8" stroke={INK} strokeWidth="0.5" />
              {/* 五層石構八角塔身與挑檐 */}
              {[
                { y: 20.1, w: 5.4, ew: 8.2 },
                { y: 17.0, w: 4.8, ew: 7.4 },
                { y: 14.1, w: 4.2, ew: 6.6 },
                { y: 11.4, w: 3.6, ew: 5.8 },
                { y: 8.9, w: 3.0, ew: 5.0 },
              ].map((tier, idx) => (
                <g key={idx}>
                  <rect
                    x={cx - tier.w / 2}
                    y={tier.y}
                    width={tier.w}
                    height="3.1"
                    fill="#e5dcc8"
                    stroke={INK}
                    strokeWidth="0.45"
                  />
                  {/* 石塔右半微陰影與佛龕 */}
                  <rect x={cx + 0.3} y={tier.y + 0.2} width={tier.w / 2 - 0.5} height="2.6" fill="#cfc8bc" opacity="0.65" />
                  <rect x={cx - 0.5} y={tier.y + 1} width="1" height="1.5" fill="#62544b" opacity="0.7" />
                  <path
                    d={`M${cx - tier.ew / 2} ${tier.y + 0.4} Q${cx} ${tier.y - 1.2} ${cx + tier.ew / 2} ${tier.y + 0.4} L${cx + tier.w / 2} ${tier.y - 0.6} H${cx - tier.w / 2} Z`}
                    fill="#9e9689"
                    stroke={INK}
                    strokeWidth="0.45"
                  />
                </g>
              ))}
              {/* 塔頂八角攢尖與銅葫蘆塔剎 */}
              <path d={`M${cx - 2.1} 8.6 L${cx} 5.4 L${cx + 2.1} 8.6 Z`} fill="#7a756b" stroke={INK} strokeWidth="0.45" />
              <line x1={cx} y1="2.8" x2={cx} y2="5.5" stroke="#c99634" strokeWidth="0.85" />
              <circle cx={cx} cy="3.1" r="0.65" fill="#f6d884" stroke={INK} strokeWidth="0.3" />
            </g>
          ))}
        </g>
      );

    /* 27. 廈門：鼓浪嶼日光岩 — 朝陽輝映花崗巨岩、海岸涼亭與鷺江波濤 */
    case 'xiamen':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* 朝陽暖金光輪 */}
          <circle cx="22.5" cy="8.2" r="4.6" fill="#f6d884" opacity="0.45" />
          <circle cx="22.5" cy="8.2" r="2.6" fill="#fff6db" opacity="0.7" />
          {/* 鷺江碧海波濤 */}
          <ellipse cx="16" cy="26.4" rx="13.4" ry="2.8" fill="#6ca9b5" stroke="#4a8594" strokeWidth="0.55" />
          {/* 海岸綠丘與巨石基座 */}
          <path d="M3.8 25.4 Q15.5 18.8 28.2 25.4 Z" fill="#5c8c67" stroke={INK} strokeWidth="0.55" />
          {/* 日光岩標誌性層疊花崗岩巨礁（龍頭山巨石） */}
          <path
            d="M8.5 23.6 C8.4 17.5 10.6 11.4 14.8 9.2 C18.8 7.2 21.8 10.4 22.6 14.8 C23.2 18.2 23.4 21.2 22.8 23.6 Z"
            fill="#d4b483"
            stroke={INK}
            strokeWidth="0.65"
          />
          {/* 岩塊立體高光與裂隙陰影 */}
          <path
            d="M11.6 12.2 C13.2 10.2 16 9.4 18.6 10.8 C17.6 13.8 14.2 14.8 11.2 14.4 Z"
            fill="#e5dcc8"
            opacity="0.7"
          />
          <path d="M18.2 10.4 C20.2 12.8 21 17.6 20.6 23.4 H22.8 C23.3 19.6 22.8 14.6 21.4 11.8 Z" fill="#9e9689" opacity="0.48" />
          <path d="M10.8 17.8 Q15.2 16.4 19.4 18.2" fill="none" stroke="#8b5a3c" strokeWidth="0.55" opacity="0.65" />
          {/* 岩畔朱頂觀海涼亭 */}
          <rect x="6.6" y="18.6" width="5.2" height="3.8" fill="#f5efe2" stroke={INK} strokeWidth="0.45" />
          <line x1="8.2" y1="18.6" x2="8.2" y2="22.4" stroke="#c43e2e" strokeWidth="0.7" />
          <line x1="10.2" y1="18.6" x2="10.2" y2="22.4" stroke="#c43e2e" strokeWidth="0.7" />
          <path d="M5.4 19 L9.2 15.8 L13 19 Z" fill="#c43e2e" stroke={INK} strokeWidth="0.55" />
          {/* 岩頂觀景欄杆 */}
          <path d="M13.6 9.4 Q16.2 8.2 18.8 9.2" fill="none" stroke="#f5efe2" strokeWidth="0.9" />
          {/* 海浪白沫 */}
          <path d="M4.5 26.2 Q8.5 25 12.5 26.2 T20.5 26.2 T27.5 26.2" fill="none" stroke="#eef7f8" strokeWidth="0.85" />
        </g>
      );

    /* 28. 漳州：福建土樓 — 經典圓形夯土防禦環堡與青瓦環頂 */
    case 'zhangzhou':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="27.8" rx="13.2" ry="2.4" fill="#2c2218" opacity="0.24" />
          {/* 閩南翠綠遠山 */}
          <path d="M3 21.5 Q9.5 13.5 16 17.8 Q22.5 13.2 29 21.5 Z" fill="#5c8c67" opacity="0.7" stroke="#4d7c5b" strokeWidth="0.5" />
          {/* 圓形夯土外牆主體 */}
          <path
            d="M4.6 13.4 V23.6 A11.4 3.8 0 0 0 27.4 23.6 V13.4 Z"
            fill="#d4b483"
            stroke={INK}
            strokeWidth="0.65"
          />
          {/* 夯土牆右側立體陰影 */}
          <path d="M21 15.4 V26.2 A11.4 3.8 0 0 0 27.4 23.6 V13.4 Z" fill="#a68352" opacity="0.45" />
          {/* 夯土橫向層理 */}
          <path d="M4.8 18.4 A11.2 3.4 0 0 0 27.2 18.4" fill="none" stroke="#a68352" strokeWidth="0.5" opacity="0.65" />
          {/* 上層環繞防禦小方窗 */}
          <g fill="#47362b">
            <rect x="6.8" y="16.4" width="1.2" height="1.5" rx="0.2" />
            <rect x="10.2" y="17.2" width="1.3" height="1.5" rx="0.2" />
            <rect x="13.8" y="17.6" width="1.3" height="1.5" rx="0.2" />
            <rect x="17.2" y="17.6" width="1.3" height="1.5" rx="0.2" />
            <rect x="20.6" y="17.2" width="1.3" height="1.5" rx="0.2" />
            <rect x="24" y="16.4" width="1.2" height="1.5" rx="0.2" />
          </g>
          {/* 石砌拱形正門 */}
          <path d="M14 27.2 V22.4 A2 2 0 0 1 18 22.4 V27.2 Z" fill="#523b2e" stroke="#e5dcc8" strokeWidth="0.65" />
          {/* 經典圓環形深瓦坡屋頂（俯視環堡外輪廓） */}
          <ellipse cx="16" cy="12.6" rx="12.6" ry="5.6" fill="#6b5e54" stroke={INK} strokeWidth="0.65" />
          <ellipse cx="16" cy="12.4" rx="11.2" ry="4.7" fill="none" stroke="#857468" strokeWidth="0.55" opacity="0.7" />
          {/* 土樓中央露天內院天井 */}
          <ellipse cx="16" cy="12.4" rx="6.6" ry="2.7" fill="#523b2e" stroke="#e5dcc8" strokeWidth="0.55" />
          <ellipse cx="16" cy="13.2" rx="4.4" ry="1.4" fill="#d4b483" opacity="0.55" />
        </g>
      );

    /* 29. 汕頭：汕頭小公園亭 — 經典八角重檐中山紀念亭 */
    case 'shantou':
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="16" cy="28.2" rx="13" ry="2.2" fill="#2c2218" opacity="0.22" />
          {/* 雙層白石八角台基與台階 */}
          <rect x="5" y="25" width="22" height="2.4" rx="0.4" fill="#e5dcc8" stroke={INK} strokeWidth="0.55" />
          <rect x="7.4" y="22.8" width="17.2" height="2.2" rx="0.3" fill="#f5efe2" stroke={INK} strokeWidth="0.5" />
          <rect x="13.6" y="22.8" width="4.8" height="4.6" fill="#dcd3c1" stroke={INK} strokeWidth="0.45" />
          {/* 一層八角朱柱與白石護欄 */}
          <rect x="8.8" y="16.4" width="14.4" height="6.4" fill="#f6d884" opacity="0.32" />
          <g stroke="#c43e2e" strokeWidth="1.15">
            <line x1="9.2" y1="16.2" x2="9.2" y2="22.8" />
            <line x1="13.2" y1="16.2" x2="13.2" y2="22.8" />
            <line x1="18.8" y1="16.2" x2="18.8" y2="22.8" />
            <line x1="22.8" y1="16.2" x2="22.8" y2="22.8" />
          </g>
          {/* 白色欄杆橫飾 */}
          <line x1="8.6" y1="21.1" x2="23.4" y2="21.1" stroke="#f5efe2" strokeWidth="0.9" />
          {/* 下層八角琉璃紅檐 */}
          <path
            d="M5.6 16.8 L8.4 13.8 H23.6 L26.4 16.8 Q16 15.6 5.6 16.8 Z"
            fill="#c85a44"
            stroke={INK}
            strokeWidth="0.6"
          />
          <path d="M6.2 16.5 Q16 15.6 25.8 16.5" fill="none" stroke="#f5efe2" strokeWidth="0.55" />
          {/* 二層八角亭身與紀念牌匾 */}
          <rect x="11" y="10.4" width="10" height="3.4" fill="#f5efe2" stroke={INK} strokeWidth="0.5" />
          <rect x="14.2" y="11" width="3.6" height="2.2" fill="#c43e2e" stroke="#e5b95c" strokeWidth="0.4" />
          {/* 上層經典八角攢尖紅頂、白脊線與金寶頂 */}
          <path d="M8.6 10.8 L16 4.4 L23.4 10.8 Q16 9.8 8.6 10.8 Z" fill="#b94a38" stroke={INK} strokeWidth="0.6" />
          <path d="M12.4 10.3 L16 4.6 L19.6 10.3" fill="none" stroke="#f5efe2" strokeWidth="0.55" opacity="0.85" />
          <line x1="16" y1="2.4" x2="16" y2="4.6" stroke="#c99634" strokeWidth="0.85" />
          <circle cx="16" cy="3.1" r="0.8" fill="#e5b95c" stroke={INK} strokeWidth="0.35" />
        </g>
      );
  }
}

export const TaiwanLandmarkIcon: React.FC<TaiwanLandmarkIconProps> = ({
  districtId,
  x,
  y,
  size = 22,
  className,
}) => {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      overflow="visible"
      aria-label={DISTRICT_LANDMARK_NAMES[districtId]}
    >
      {renderLandmarkArtwork(districtId)}
    </svg>
  );
};
