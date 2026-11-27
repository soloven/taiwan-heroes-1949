import React, { useId } from 'react';

export const BESPOKE_PORTRAIT_IDS = new Set<string>([
  // SR (6)
  'bajiajiang',
  'leopard_cat',
  'clouded_leopard',
  'liu_mingchuan',
  'lin_shuangwen',
  'shen_baozhen',
  // R (8)
  'swinhoe_pheasant',
  'changhua_farmer',
  'anping_helmsman',
  'tamsui_merchant',
  'puyuma_hunter',
  'penghu_mariner',
  'hakka_pikeman',
  'lanyang_pioneer',
]);

export function hasBespokeHeroPortrait(heroId: string): boolean {
  return BESPOKE_PORTRAIT_IDS.has(heroId);
}

interface HeroPortraitSvgProps {
  heroId: string;
  className?: string;
}

/**
 * Shared Taiwan Temple Jiannian (剪黏) & Shadow-Puppet (皮影戲) Corner Filigree
 */
const TempleCornerMotifs: React.FC<{ accent?: string; gold?: string }> = ({
  accent = '#e55b45',
  gold = '#f7cd6d',
}) => (
  <g pointerEvents="none">
    {/* Subtle outer shadow-puppet aperture frame */}
    <rect
      x="5"
      y="5"
      width="190"
      height="190"
      rx="10"
      fill="none"
      stroke={gold}
      strokeWidth="1.2"
      strokeOpacity="0.45"
    />
    <rect
      x="9"
      y="9"
      width="182"
      height="182"
      rx="7"
      fill="none"
      stroke={accent}
      strokeWidth="0.7"
      strokeDasharray="4 4"
      strokeOpacity="0.35"
    />
    {/* Top-Left Jiannian Corner */}
    <path
      d="M7 28 V11 Q7 7 11 7 H28"
      fill="none"
      stroke={gold}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M12 20 Q12 12 20 12" fill="none" stroke={accent} strokeWidth="1.4" />
    <circle cx="13" cy="13" r="2.2" fill={accent} stroke={gold} strokeWidth="0.8" />
    {/* Top-Right Jiannian Corner */}
    <path
      d="M193 28 V11 Q193 7 189 7 H172"
      fill="none"
      stroke={gold}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M188 20 Q188 12 180 12" fill="none" stroke={accent} strokeWidth="1.4" />
    <circle cx="187" cy="13" r="2.2" fill={accent} stroke={gold} strokeWidth="0.8" />
    {/* Bottom-Left Jiannian Corner */}
    <path
      d="M7 172 V189 Q7 193 11 193 H28"
      fill="none"
      stroke={gold}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M12 180 Q12 188 20 188" fill="none" stroke={accent} strokeWidth="1.4" />
    <circle cx="13" cy="187" r="2.2" fill={accent} stroke={gold} strokeWidth="0.8" />
    {/* Bottom-Right Jiannian Corner */}
    <path
      d="M193 172 V189 Q193 193 189 193 H172"
      fill="none"
      stroke={gold}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M188 180 Q188 188 180 188" fill="none" stroke={accent} strokeWidth="1.4" />
    <circle cx="187" cy="187" r="2.2" fill={accent} stroke={gold} strokeWidth="0.8" />
  </g>
);

/**
 * Shared Shadow-Puppet Perforated Halo (皮影鏤空光輪)
 */
const PuppetHalo: React.FC<{
  cx?: number;
  cy?: number;
  r?: number;
  color?: string;
}> = ({ cx = 100, cy = 88, r = 64, color = '#f7cd6d' }) => (
  <g opacity="0.34" pointerEvents="none">
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.4" />
    <circle
      cx={cx}
      cy={cy}
      r={r - 6}
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeDasharray="6 5"
    />
    <circle
      cx={cx}
      cy={cy}
      r={r + 5}
      fill="none"
      stroke={color}
      strokeWidth="0.8"
      strokeDasharray="2 6"
    />
  </g>
);

export const HeroPortraitSvg: React.FC<HeroPortraitSvgProps> = ({
  heroId,
  className = 'w-full h-full',
}) => {
  const uid = useId();

  switch (heroId) {
    /* ======================================================================
       SR 1: 八家將先鋒・范謝將軍 (bajiajiang)
       Painted face mask silhouette, tall official hat, glowing golden talisman fan & shackles, temple fire aura
       ====================================================================== */
    case 'bajiajiang':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="范謝將軍">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#ff9436" />
              <stop offset="42%" stopColor="#991b1b" />
              <stop offset="82%" stopColor="#2a0d0b" />
              <stop offset="100%" stopColor="#120708" />
            </radialGradient>
            <linearGradient id={`${uid}-hat`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#d4aa5a" />
            </linearGradient>
            <linearGradient id={`${uid}-fan`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
          <PuppetHalo cx={100} cy={88} r={66} color="#fcd34d" />

          {/* Temple fire wisps */}
          <path
            d="M28 165 Q18 122 44 96 Q36 120 52 132 Q42 98 66 72 Q58 104 74 126 Z"
            fill="#ea580c"
            opacity="0.45"
          />
          <path
            d="M172 165 Q182 122 156 96 Q164 120 148 132 Q158 98 134 72 Q142 104 126 126 Z"
            fill="#f59e0b"
            opacity="0.4"
          />

          {/* Heavy iron shackles chain draped across foreground */}
          <g stroke="#e2c992" strokeWidth="2.4" fill="none" opacity="0.88">
            <ellipse cx="42" cy="148" rx="7" ry="4.5" transform="rotate(-25 42 148)" />
            <ellipse cx="54" cy="154" rx="7" ry="4.5" transform="rotate(15 54 154)" />
            <ellipse cx="66" cy="157" rx="7" ry="4.5" transform="rotate(-15 66 157)" />
            <ellipse cx="158" cy="148" rx="7" ry="4.5" transform="rotate(25 158 148)" />
            <ellipse cx="146" cy="154" rx="7" ry="4.5" transform="rotate(-15 146 154)" />
          </g>

          {/* Shadow-puppet shoulders & temple battle robe */}
          <path
            d="M36 200 L48 142 Q74 128 100 132 Q126 128 152 142 L164 200 Z"
            fill="#190e0e"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />
          {/* Embroidered cloud collar */}
          <path
            d="M66 138 Q100 162 134 138 L124 158 Q100 174 76 158 Z"
            fill="#991b1b"
            stroke="#f7cd6d"
            strokeWidth="1.4"
          />

          {/* Tall official hat (長帽) */}
          <path
            d="M78 66 L83 18 L117 18 L122 66 Z"
            fill={`url(#${uid}-hat)`}
            stroke="#3b150e"
            strokeWidth="2"
          />
          {/* Red silk band & gold filigree on hat */}
          <rect x="81" y="56" width="38" height="8" fill="#b91c1c" />
          <path
            d="M100 24 V52 M93 30 H107 M95 38 H105 M93 46 H107"
            stroke="#7f1d1d"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Hat brim */}
          <path
            d="M66 68 Q100 60 134 68 L128 74 Q100 68 72 74 Z"
            fill="#1f1210"
            stroke="#f7cd6d"
            strokeWidth="1.4"
          />

          {/* Elaborate Bajiajiang painted face mask */}
          <path
            d="M73 74 Q71 112 100 126 Q129 112 127 74 Z"
            fill="#1c1414"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />
          {/* Half-white / half-vermilion painted opera mask swirls */}
          <path
            d="M75 76 Q88 76 98 86 Q96 106 86 116 Q75 104 75 76 Z"
            fill="#f5ecd8"
            opacity="0.92"
          />
          <path
            d="M125 76 Q112 76 102 86 Q104 106 114 116 Q125 104 125 76 Z"
            fill="#c83e2b"
            opacity="0.9"
          />
          {/* Fierce glowing eyes & forehead flame mark */}
          <path d="M82 90 L94 94 L84 96 Z" fill="#fde047" />
          <path d="M118 90 L106 94 L116 96 Z" fill="#fde047" />
          <path d="M100 76 L104 84 L100 88 L96 84 Z" fill="#f7cd6d" />

          {/* Glowing golden talisman fan (羽扇/令扇) held at right */}
          <g transform="translate(148, 128) rotate(18)">
            <path
              d="M0 24 L-26 -22 Q0 -36 26 -22 Z"
              fill={`url(#${uid}-fan)`}
              stroke="#fef3c7"
              strokeWidth="1.4"
            />
            <path
              d="M0 22 L-14 -18 M0 22 L0 -24 M0 22 L14 -18"
              stroke="#7c2d12"
              strokeWidth="1.2"
            />
            <circle cx="0" cy="-6" r="6" fill="#991b1b" stroke="#fef3c7" strokeWidth="1" />
          </g>

          <TempleCornerMotifs accent="#e55b45" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       SR 2: 台灣石虎斥候 (leopard_cat)
       Spotted Formosan leopard cat warrior, hooded cloak, twin daggers, glowing amber eyes & moonlit bamboo
       ====================================================================== */
    case 'leopard_cat':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="台灣石虎斥候">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="38%" stopColor="#4c2c12" />
              <stop offset="78%" stopColor="#121e1a" />
              <stop offset="100%" stopColor="#080e0d" />
            </radialGradient>
            <linearGradient id={`${uid}-fur`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e5b363" />
              <stop offset="100%" stopColor="#8c541d" />
            </linearGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Full lantern moon behind bamboo */}
          <circle cx="100" cy="72" r="46" fill="#fef3c7" opacity="0.22" />
          <circle cx="100" cy="72" r="36" fill="#fde68a" opacity="0.32" />

          {/* Moonlit bamboo silhouettes */}
          <g stroke="#1b3a2e" strokeWidth="5" strokeLinecap="round" opacity="0.8">
            <line x1="28" y1="195" x2="36" y2="14" />
            <line x1="172" y1="195" x2="162" y2="18" />
          </g>
          <g fill="#2d5a47" opacity="0.75">
            <path d="M34 55 Q52 44 64 52 Q48 58 34 55 Z" />
            <path d="M32 82 Q16 74 10 86 Q24 88 32 82 Z" />
            <path d="M166 64 Q146 52 134 62 Q150 68 166 64 Z" />
            <path d="M168 94 Q184 86 190 98 Q176 100 168 94 Z" />
          </g>

          {/* Hooded scout cloak */}
          <path
            d="M36 200 L54 128 Q64 56 100 44 Q136 56 146 128 L164 200 Z"
            fill="#1b2622"
            stroke="#d4aa5a"
            strokeWidth="1.8"
          />
          <path
            d="M52 142 Q100 162 148 142 L156 200 H44 Z"
            fill="#141a18"
            stroke="#b45309"
            strokeWidth="1.2"
          />

          {/* Formosan Leopard Cat ears with iconic white ear-back spots */}
          <path d="M68 74 L58 46 L86 62 Z" fill={`url(#${uid}-fur)`} stroke="#2a1608" strokeWidth="1.6" />
          <ellipse cx="68" cy="59" rx="4.5" ry="3.2" fill="#fef9e7" />
          <path d="M132 74 L142 46 L114 62 Z" fill={`url(#${uid}-fur)`} stroke="#2a1608" strokeWidth="1.6" />
          <ellipse cx="132" cy="59" rx="4.5" ry="3.2" fill="#fef9e7" />

          {/* Leopard Cat Head */}
          <path
            d="M66 80 Q66 58 100 58 Q134 58 134 80 Q134 114 100 124 Q66 114 66 80 Z"
            fill={`url(#${uid}-fur)`}
            stroke="#2a1608"
            strokeWidth="1.8"
          />
          {/* Iconic white forehead stripes */}
          <path d="M93 64 V86 M107 64 V86" stroke="#fef9e7" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M87 66 V84 M113 66 V84" stroke="#2c1709" strokeWidth="2" strokeLinecap="round" />
          {/* Cheek leopard spots */}
          <circle cx="76" cy="98" r="2.8" fill="#2c1709" />
          <circle cx="84" cy="105" r="2.2" fill="#2c1709" />
          <circle cx="124" cy="98" r="2.8" fill="#2c1709" />
          <circle cx="116" cy="105" r="2.2" fill="#2c1709" />

          {/* Glowing amber predator eyes */}
          <path d="M77 86 Q85 81 92 88 Q84 93 77 86 Z" fill="#fef08a" stroke="#1c1108" strokeWidth="1.2" />
          <ellipse cx="85" cy="87" rx="1.6" ry="3.2" fill="#1c1108" />
          <path d="M123 86 Q115 81 108 88 Q116 93 123 86 Z" fill="#fef08a" stroke="#1c1108" strokeWidth="1.2" />
          <ellipse cx="115" cy="87" rx="1.6" ry="3.2" fill="#1c1108" />
          {/* Muzzle */}
          <path d="M95 100 L100 105 L105 100 Z" fill="#2c1709" />

          {/* Twin curved scout daggers */}
          <g stroke="#fef3c7" strokeWidth="1.4">
            <path d="M52 178 L34 128 Q42 122 50 132 L62 174 Z" fill="#cbd5e1" />
            <path d="M148 178 L166 128 Q158 122 150 132 L138 174 Z" fill="#cbd5e1" />
          </g>
          <path d="M46 168 L64 162 M154 168 L136 162" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

          <TempleCornerMotifs accent="#f59e0b" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       SR 3: 雲豹山林影衛 (clouded_leopard)
       Majestic Formosan clouded leopard spirit guardian, tribal jade crest, mist swirls & Dawu mountain peaks
       ====================================================================== */
    case 'clouded_leopard':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="雲豹山林影衛">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.85" />
              <stop offset="42%" stopColor="#3b1f6e" />
              <stop offset="80%" stopColor="#14182b" />
              <stop offset="100%" stopColor="#090c17" />
            </radialGradient>
            <linearGradient id={`${uid}-jade`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#134739" />
            </linearGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
          <PuppetHalo cx={100} cy={84} r={62} color="#6ee7b7" />

          {/* Dawu Mountain (大武山) layered silhouettes */}
          <path d="M10 154 L56 88 L98 134 L144 76 L190 154 Z" fill="#1a1d36" opacity="0.85" />
          <path d="M10 164 L78 106 L124 146 L168 102 L190 164 Z" fill="#101526" />

          {/* Swirling mountain mist ribbons */}
          <path
            d="M14 134 Q54 120 96 132 T186 126"
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="3"
            opacity="0.35"
            strokeLinecap="round"
          />
          <path
            d="M22 152 Q68 140 112 150 T182 146"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="2.5"
            opacity="0.3"
            strokeLinecap="round"
          />

          {/* Guardian mantle with clouded rosette motifs */}
          <path
            d="M34 200 L54 132 Q100 116 146 132 L166 200 Z"
            fill="#231c35"
            stroke="#c4b5fd"
            strokeWidth="1.6"
          />
          {/* Clouded-leopard dark cloud patches on cloak */}
          <path d="M58 152 Q68 144 76 154 Q70 166 58 162 Z" fill="#110d1c" stroke="#a78bfa" strokeWidth="0.9" />
          <path d="M142 152 Q132 144 124 154 Q130 166 142 162 Z" fill="#110d1c" stroke="#a78bfa" strokeWidth="0.9" />

          {/* Clouded Leopard Spirit Head */}
          <path d="M68 72 L60 48 L84 60 Z" fill="#d8c9b0" stroke="#1f1630" strokeWidth="1.6" />
          <path d="M132 72 L140 48 L116 60 Z" fill="#d8c9b0" stroke="#1f1630" strokeWidth="1.6" />
          <path
            d="M64 82 Q64 56 100 56 Q136 56 136 82 Q134 118 100 128 Q66 118 64 82 Z"
            fill="#d8c9b0"
            stroke="#241938"
            strokeWidth="1.8"
          />
          {/* Tribal Rukai/Paiwan diamond-jade forehead crest */}
          <polygon
            points="100,44 112,62 100,78 88,62"
            fill={`url(#${uid}-jade)`}
            stroke="#f7cd6d"
            strokeWidth="1.5"
          />
          <circle cx="100" cy="62" r="3.5" fill="#fef3c7" />

          {/* Glowing jade spirit eyes */}
          <path d="M76 88 Q85 83 93 90 Q84 95 76 88 Z" fill="#6ee7b7" />
          <path d="M124 88 Q115 83 107 90 Q116 95 124 88 Z" fill="#6ee7b7" />
          {/* Clouded cheek markings */}
          <path d="M70 100 Q80 96 86 106" fill="none" stroke="#3b2c54" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M130 100 Q120 96 114 106" fill="none" stroke="#3b2c54" strokeWidth="2.4" strokeLinecap="round" />

          {/* Tribal spirit bow arc */}
          <path
            d="M158 56 Q178 108 156 168"
            fill="none"
            stroke="#f7cd6d"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <line x1="158" y1="58" x2="156" y2="166" stroke="#a7f3d0" strokeWidth="1" opacity="0.7" />

          <TempleCornerMotifs accent="#6ee7b7" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       SR 4: 劉銘傳・鐵道督辦 (liu_mingchuan)
       Qing governor-general in mandarin robe & peacock plume hat, steaming antique locomotive & golden rails
       ====================================================================== */
    case 'liu_mingchuan':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="劉銘傳">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85" />
              <stop offset="44%" stopColor="#1e3a8a" />
              <stop offset="82%" stopColor="#111827" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Rising locomotive steam clouds */}
          <g fill="#e2e8f0" opacity="0.24">
            <circle cx="48" cy="64" r="18" />
            <circle cx="68" cy="52" r="22" />
            <circle cx="38" cy="84" r="14" />
            <circle cx="152" cy="66" r="16" />
          </g>

          {/* Antique Tengyun (騰雲號) Steam Locomotive silhouette */}
          <g fill="#0f172a" stroke="#f7cd6d" strokeWidth="1.2" opacity="0.9">
            <rect x="20" y="106" width="52" height="24" rx="3" />
            <rect x="28" y="84" width="11" height="22" />
            <path d="M24 84 H43 L39 78 H28 Z" />
            <circle cx="32" cy="134" r="7" fill="#1e293b" />
            <circle cx="52" cy="134" r="7" fill="#1e293b" />
          </g>

          {/* Golden railway tracks converging in perspective */}
          <g stroke="#f7cd6d" strokeWidth="1.6" opacity="0.72">
            <line x1="12" y1="154" x2="188" y2="154" />
            <line x1="12" y1="146" x2="188" y2="146" />
            <line x1="30" y1="146" x2="26" y2="154" />
            <line x1="55" y1="146" x2="52" y2="154" />
            <line x1="148" y1="146" x2="151" y2="154" />
            <line x1="172" y1="146" x2="176" y2="154" />
          </g>

          {/* Qing Governor-General Mandarin Robe */}
          <path
            d="M44 200 L60 134 Q100 120 140 134 L156 200 Z"
            fill="#172554"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />
          {/* Imperial rank badge (補子) on chest */}
          <rect
            x="82"
            y="148"
            width="36"
            height="32"
            rx="2"
            fill="#991b1b"
            stroke="#f7cd6d"
            strokeWidth="1.5"
          />
          <path d="M90 164 Q100 152 110 164 Q100 172 90 164 Z" fill="#f7cd6d" opacity="0.85" />
          {/* Court bead necklace (朝珠) */}
          <path
            d="M78 134 Q100 156 122 134"
            fill="none"
            stroke="#fde68a"
            strokeWidth="2.4"
            strokeDasharray="2 3"
          />

          {/* Qing Official Hat (官帽) with red tassel & peacock feather plume (花翎) */}
          <path
            d="M122 66 Q152 60 170 76 Q148 76 124 72 Z"
            fill="#10b981"
            stroke="#f7cd6d"
            strokeWidth="1"
          />
          <circle cx="158" cy="70" r="3" fill="#f7cd6d" />
          <path
            d="M62 72 Q100 44 138 72 Z"
            fill="#0f172a"
            stroke="#f7cd6d"
            strokeWidth="1.6"
          />
          <path d="M72 64 Q100 50 128 64" fill="none" stroke="#dc2626" strokeWidth="4" />
          {/* Ruby/gold finial knob */}
          <circle cx="100" cy="46" r="5" fill="#dc2626" stroke="#f7cd6d" strokeWidth="1.4" />

          {/* Dignified silhouette face & mandarin beard */}
          <path
            d="M78 74 Q78 112 100 124 Q122 112 122 74 Z"
            fill="#e8cfa8"
            stroke="#3b2614"
            strokeWidth="1.6"
          />
          <path d="M86 88 H95 M105 88 H114" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
          {/* Mustache & flowing beard */}
          <path
            d="M84 108 Q100 102 116 108 Q112 128 100 134 Q88 128 84 108 Z"
            fill="#1e293b"
          />

          <TempleCornerMotifs accent="#60a5fa" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       SR 5: 林爽文・天地會首 (lin_shuangwen)
       Rebel leader with flying headscarf, raised broadsword, roaring crimson flame banner & Tiandihui seal
       ====================================================================== */
    case 'lin_shuangwen':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="林爽文">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="42%" r="66%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="40%" stopColor="#b91c1c" />
              <stop offset="78%" stopColor="#3b0f0c" />
              <stop offset="100%" stopColor="#140707" />
            </radialGradient>
            <linearGradient id={`${uid}-blade`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Roaring crimson Tiandihui war banner behind */}
          <path
            d="M22 24 H94 L82 64 L96 102 H22 Z"
            fill="#991b1b"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />
          {/* Tiandihui (天地會) symbolic triad triangle seal */}
          <polygon
            points="54,44 72,78 36,78"
            fill="none"
            stroke="#fde68a"
            strokeWidth="2"
          />
          <circle cx="54" cy="66" r="4" fill="#fde68a" />

          {/* Raised broadsword (大刀) sweeping across sky */}
          <path
            d="M126 118 L174 34 Q186 48 176 74 L138 128 Z"
            fill={`url(#${uid}-blade)`}
            stroke="#fef3c7"
            strokeWidth="1.4"
          />
          <rect
            x="118"
            y="116"
            width="22"
            height="6"
            rx="2"
            transform="rotate(34 129 119)"
            fill="#f59e0b"
          />

          {/* Flying crimson rebel headscarf tails */}
          <path
            d="M118 68 Q154 58 178 72 Q156 80 124 78 Z"
            fill="#dc2626"
            stroke="#fde68a"
            strokeWidth="1"
          />
          <path
            d="M118 76 Q148 80 166 96 Q142 94 120 84 Z"
            fill="#b91c1c"
          />

          {/* Heroic martial torso & leather chest wrap */}
          <path
            d="M36 200 L52 132 Q96 116 142 132 L160 200 Z"
            fill="#231410"
            stroke="#f59e0b"
            strokeWidth="1.8"
          />
          <path d="M58 138 L134 196 M134 138 L58 196" stroke="#991b1b" strokeWidth="8" opacity="0.85" />
          <path d="M58 138 L134 196 M134 138 L58 196" stroke="#f7cd6d" strokeWidth="1.4" />

          {/* Rebel leader head & tied crimson headband */}
          <path
            d="M72 72 Q72 114 98 124 Q124 114 124 72 Z"
            fill="#e5bf93"
            stroke="#3b1d10"
            strokeWidth="1.6"
          />
          <path
            d="M68 72 Q98 54 128 72 L126 84 Q98 76 70 84 Z"
            fill="#dc2626"
            stroke="#f7cd6d"
            strokeWidth="1.4"
          />
          {/* Fierce brows & eyes */}
          <path d="M80 90 L93 95 M116 90 L103 95" stroke="#1c110c" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M86 108 Q98 104 110 108" fill="none" stroke="#1c110c" strokeWidth="2.4" strokeLinecap="round" />

          <TempleCornerMotifs accent="#fb923c" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       SR 6: 沈葆楨・億載督師 (shen_baozhen)
       Imperial commissioner holding naval blueprint scroll, Fort Eternal Golden Castle red-brick bastion & coastal cannons
       ====================================================================== */
    case 'shen_baozhen':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="沈葆楨">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.8" />
              <stop offset="44%" stopColor="#0f5156" />
              <stop offset="82%" stopColor="#0c1f24" />
              <stop offset="100%" stopColor="#071114" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
          <PuppetHalo cx={100} cy={82} r={62} color="#5eead4" />

          {/* Fort Eternal Golden Castle (億載金城) red-brick bastion silhouette */}
          <path
            d="M12 138 H188 V164 H12 Z"
            fill="#7f1d1d"
            stroke="#f7cd6d"
            strokeWidth="1.3"
          />
          {/* Arched fortress gate & brick battlements */}
          <path d="M12 138 V126 H34 V138 M48 138 V126 H70 V138 M130 138 V126 H152 V138 M166 138 V126 H188 V138" fill="#7f1d1d" stroke="#d4aa5a" strokeWidth="1" />
          {/* Coastal Armstrong cannon silhouette on bastion */}
          <g fill="#1e293b" stroke="#f7cd6d" strokeWidth="1">
            <rect x="20" y="118" width="32" height="9" rx="3" transform="rotate(-12 36 122)" />
            <circle cx="34" cy="128" r="5" />
          </g>

          {/* Imperial Commissioner Robe (Teal-Jade & Gold) */}
          <path
            d="M44 200 L60 132 Q100 118 140 132 L156 200 Z"
            fill="#134e4a"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />

          {/* Official Hat */}
          <path d="M64 70 Q100 46 136 70 Z" fill="#0f172a" stroke="#f7cd6d" strokeWidth="1.6" />
          <path d="M74 63 Q100 50 126 63" fill="none" stroke="#c83e2b" strokeWidth="3.5" />
          <circle cx="100" cy="48" r="4.5" fill="#f7cd6d" />

          {/* Scholar-general face */}
          <path
            d="M78 72 Q78 110 100 122 Q122 110 122 72 Z"
            fill="#ecd4b0"
            stroke="#2f2216"
            strokeWidth="1.6"
          />
          <path d="M86 88 H95 M105 88 H114" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d="M90 110 Q100 118 110 110 L105 128 Q100 132 95 128 Z" fill="#334155" />

          {/* Glowing Naval Blueprint Scroll held in front */}
          <g transform="translate(100, 168)">
            <rect
              x="-44"
              y="-18"
              width="88"
              height="34"
              rx="3"
              fill="#fef3c7"
              stroke="#b45309"
              strokeWidth="1.8"
            />
            <rect x="-50" y="-21" width="7" height="40" rx="3" fill="#92400e" stroke="#f7cd6d" strokeWidth="1" />
            <rect x="43" y="-21" width="7" height="40" rx="3" fill="#92400e" stroke="#f7cd6d" strokeWidth="1" />
            {/* Fortress & sea chart markings */}
            <path d="M-30 -6 H30 M-30 4 H16" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="0,-10 10,0 0,10 -10,0" fill="none" stroke="#b91c1c" strokeWidth="1.4" />
          </g>

          <TempleCornerMotifs accent="#2dd4bf" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 1: 藍腹鷴神射手 (swinhoe_pheasant)
       Plumed Formosan blue pheasant archer drawing a glowing bow amidst emerald feathers
       ====================================================================== */
    case 'swinhoe_pheasant':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="藍腹鷴神射手">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="48%" cy="40%" r="66%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="44%" stopColor="#1e3a8a" />
              <stop offset="82%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#070c18" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
          <PuppetHalo cx={96} cy={86} r={60} color="#7dd3fc" />

          {/* Sweeping emerald & sapphire tail feathers */}
          <path d="M24 176 Q44 102 88 86 Q62 126 48 184 Z" fill="#0d9488" opacity="0.85" />
          <path d="M38 186 Q66 118 104 98 Q80 138 66 192 Z" fill="#f8fafc" opacity="0.82" />
          <path d="M16 154 Q34 94 78 78 Q52 114 34 166 Z" fill="#2563eb" opacity="0.78" />

          {/* Archer body in metallic cobalt plumage */}
          <path
            d="M46 200 L64 128 Q98 112 134 128 L152 200 Z"
            fill="#1e3a8a"
            stroke="#93c5fd"
            strokeWidth="1.6"
          />

          {/* Swinhoe's Pheasant Head: white crown crest + vivid crimson face patch */}
          <path d="M84 56 Q104 34 128 46 Q112 56 102 64 Z" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1.2" />
          <circle cx="96" cy="82" r="24" fill="#1d4ed8" stroke="#f7cd6d" strokeWidth="1.6" />
          {/* Crimson wattle patch */}
          <ellipse cx="104" cy="82" rx="12" ry="9" fill="#dc2626" />
          {/* Sharp golden eye & beak */}
          <circle cx="104" cy="80" r="3" fill="#fef08a" />
          <circle cx="105" cy="80" r="1.4" fill="#0f172a" />
          <polygon points="118,80 134,86 116,91" fill="#f7cd6d" />

          {/* Glowing Recurve Bow & Drawn Spirit Arrow */}
          <path
            d="M142 42 Q178 100 142 162"
            fill="none"
            stroke="#f7cd6d"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path d="M142 44 L106 102 L142 160" fill="none" stroke="#bae6fd" strokeWidth="1.3" />
          <line x1="102" y1="102" x2="178" y2="102" stroke="#fef08a" strokeWidth="2.6" strokeLinecap="round" />
          <polygon points="174,95 186,102 174,109" fill="#fef08a" />

          <TempleCornerMotifs accent="#38bdf8" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 2: 彰化農耕鄉賢 (changhua_farmer)
       Straw conical hat elder holding golden rice sheaves & bamboo staff over warm sunlit terraced fields
       ====================================================================== */
    case 'changhua_farmer':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="施世榜・彰化農耕鄉賢">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="35%" r="68%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.92" />
              <stop offset="42%" stopColor="#854d0e" />
              <stop offset="80%" stopColor="#273619" />
              <stop offset="100%" stopColor="#10180c" />
            </radialGradient>
            <linearGradient id={`${uid}-hat`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Sunlit terraced fields & Babao Canal (八堡圳) */}
          <path d="M10 144 Q60 130 100 142 T190 136 V200 H10 Z" fill="#365314" opacity="0.85" />
          <path d="M10 162 Q70 150 120 162 T190 156 V200 H10 Z" fill="#4d7c0f" opacity="0.8" />
          {/* Shimmering irrigation canal */}
          <path d="M12 176 Q100 164 188 180" fill="none" stroke="#7dd3fc" strokeWidth="4" opacity="0.65" />

          {/* Bamboo staff */}
          <line x1="154" y1="42" x2="146" y2="196" stroke="#a3e635" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="152" y1="74" x2="156" y2="74" stroke="#365314" strokeWidth="2" />
          <line x1="149" y1="114" x2="153" y2="114" stroke="#365314" strokeWidth="2" />

          {/* Elder farmer tunic */}
          <path
            d="M44 200 L60 126 Q100 112 140 126 L154 200 Z"
            fill="#422d1b"
            stroke="#e4c890"
            strokeWidth="1.6"
          />

          {/* Iconic Taiwanese conical straw hat (斗笠) */}
          <path
            d="M32 82 L100 34 L168 82 Q100 94 32 82 Z"
            fill={`url(#${uid}-hat)`}
            stroke="#5c3610"
            strokeWidth="2"
          />
          <path d="M56 76 L100 36 L144 76 M78 80 L100 36 L122 80" stroke="#92400e" strokeWidth="1" opacity="0.55" />

          {/* Kind elder face & white beard */}
          <path d="M78 84 Q78 114 100 122 Q122 114 122 84 Z" fill="#e8caa0" stroke="#422d1b" strokeWidth="1.4" />
          <path d="M88 112 Q100 132 112 112 Q106 128 100 136 Q94 128 88 112 Z" fill="#f8fafc" />

          {/* Golden rice sheaves held in arms */}
          <g transform="translate(56, 152) rotate(-18)">
            <path d="M-12 26 Q0 -14 12 26 Z" fill="#eab308" stroke="#713f12" strokeWidth="1.4" />
            <ellipse cx="-6" cy="-4" rx="5" ry="12" transform="rotate(-20 -6 -4)" fill="#fde047" />
            <ellipse cx="4" cy="-6" rx="5" ry="12" transform="rotate(14 4 -6)" fill="#facc15" />
            <line x1="-10" y1="14" x2="10" y2="14" stroke="#b91c1c" strokeWidth="3" />
          </g>

          <TempleCornerMotifs accent="#a3e635" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 3: 安平水師舵手 (anping_helmsman)
       Ming naval helmsman gripping wooden ship wheel with billowing junk sails & crashing waves
       ====================================================================== */
    case 'anping_helmsman':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="安平水師舵手">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="46%" stopColor="#075985" />
              <stop offset="82%" stopColor="#0c1f30" />
              <stop offset="100%" stopColor="#06101a" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Billowing slatted Chinese/Ming junk sail behind */}
          <path
            d="M28 24 Q108 32 132 120 L28 124 Z"
            fill="#f5ecd8"
            opacity="0.28"
            stroke="#f7cd6d"
            strokeWidth="1.4"
          />
          <line x1="28" y1="54" x2="110" y2="58" stroke="#f7cd6d" strokeWidth="1.2" opacity="0.45" />
          <line x1="28" y1="86" x2="124" y2="90" stroke="#f7cd6d" strokeWidth="1.2" opacity="0.45" />

          {/* Helmsman silhouette & naval headscarf */}
          <path
            d="M46 200 L60 124 Q100 110 140 124 L154 200 Z"
            fill="#172a3a"
            stroke="#7dd3fc"
            strokeWidth="1.6"
          />
          <circle cx="100" cy="82" r="24" fill="#d9b288" stroke="#1e293b" strokeWidth="1.6" />
          <path d="M74 74 Q100 54 126 74 L122 82 Q100 72 78 82 Z" fill="#0369a1" stroke="#f7cd6d" strokeWidth="1.4" />
          <path d="M88 86 H96 M104 86 H112" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />

          {/* Iconic Wooden Ship Wheel (舵輪) in foreground */}
          <g transform="translate(100, 152)" stroke="#d4aa5a" fill="none">
            <circle cx="0" cy="0" r="34" strokeWidth="5.5" stroke="#78350f" />
            <circle cx="0" cy="0" r="34" strokeWidth="1.8" stroke="#f7cd6d" />
            <circle cx="0" cy="0" r="10" fill="#78350f" stroke="#f7cd6d" strokeWidth="1.8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="-10"
                x2="0"
                y2="-44"
                stroke="#f7cd6d"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}
          </g>

          {/* Crashing ink-wash sea spray at bottom */}
          <path
            d="M8 186 Q34 170 60 184 T114 182 T168 184 L194 180 V200 H8 Z"
            fill="#0284c7"
            opacity="0.72"
          />
          <path
            d="M8 186 Q34 170 60 184 T114 182 T168 184"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2"
          />

          <TempleCornerMotifs accent="#38bdf8" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 4: 淡水洋行掌櫃 (tamsui_merchant)
       Tea merchant with abacus, red-brick Dadaocheng/Tamsui archways & glowing tea lantern
       ====================================================================== */
    case 'tamsui_merchant':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="淡水洋行掌櫃">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.92" />
              <stop offset="44%" stopColor="#92400e" />
              <stop offset="82%" stopColor="#29140c" />
              <stop offset="100%" stopColor="#120a07" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Red-brick Dadaocheng / Tamsui arcade archways (亭仔腳) */}
          <path
            d="M12 52 H188 V160 H164 V98 Q164 74 142 74 Q120 74 120 98 V160 H80 V98 Q80 74 58 74 Q36 74 36 98 V160 H12 Z"
            fill="#7f1d1d"
            opacity="0.55"
            stroke="#d4aa5a"
            strokeWidth="1.2"
          />

          {/* Hanging glowing red-gold tea lantern */}
          <line x1="158" y1="12" x2="158" y2="34" stroke="#f7cd6d" strokeWidth="1.5" />
          <ellipse cx="158" cy="50" rx="14" ry="17" fill="#dc2626" stroke="#fde68a" strokeWidth="1.6" />
          <ellipse cx="158" cy="50" rx="7" ry="15" fill="#fbbf24" opacity="0.45" />
          <rect x="151" y="31" width="14" height="4" fill="#f7cd6d" />
          <rect x="151" y="66" width="14" height="4" fill="#f7cd6d" />

          {/* Silk merchant robe & skullcap (瓜皮帽) */}
          <path
            d="M44 200 L60 128 Q100 116 140 128 L156 200 Z"
            fill="#451a03"
            stroke="#f7cd6d"
            strokeWidth="1.8"
          />
          <path d="M74 72 Q100 46 126 72 Z" fill="#1c1917" stroke="#f7cd6d" strokeWidth="1.6" />
          <circle cx="100" cy="52" r="3.5" fill="#dc2626" />
          <circle cx="100" cy="88" r="22" fill="#ebd2ad" stroke="#451a03" strokeWidth="1.5" />
          {/* Round merchant spectacles */}
          <circle cx="91" cy="88" r="6" fill="none" stroke="#f7cd6d" strokeWidth="1.6" />
          <circle cx="109" cy="88" r="6" fill="none" stroke="#f7cd6d" strokeWidth="1.6" />
          <line x1="97" y1="88" x2="103" y2="88" stroke="#f7cd6d" strokeWidth="1.4" />

          {/* Golden Abacus (算盤) held in foreground */}
          <g transform="translate(100, 162)">
            <rect x="-46" y="-20" width="92" height="40" rx="4" fill="#29150b" stroke="#f7cd6d" strokeWidth="2.4" />
            <line x1="-44" y1="-4" x2="44" y2="-4" stroke="#f7cd6d" strokeWidth="2.4" />
            {[-32, -16, 0, 16, 32].map((x) => (
              <g key={x}>
                <line x1={x} y1="-18" x2={x} y2="18" stroke="#d4aa5a" strokeWidth="1.4" />
                <ellipse cx={x} cy="-11" rx="5.5" ry="3.4" fill="#fbbf24" />
                <ellipse cx={x} cy="5" rx="5.5" ry="3.4" fill="#f59e0b" />
                <ellipse cx={x} cy="12" rx="5.5" ry="3.4" fill="#f59e0b" />
              </g>
            ))}
          </g>

          <TempleCornerMotifs accent="#fbbf24" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 5: 卑南獵山勇士 (puyuma_hunter)
       Indigenous mountain hunter with feathered headband, carved spear & sacred mountain sunrise
       ====================================================================== */
    case 'puyuma_hunter':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="卑南獵山勇士">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="42%" r="68%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.78" />
              <stop offset="38%" stopColor="#6b21a8" />
              <stop offset="78%" stopColor="#1e1033" />
              <stop offset="100%" stopColor="#0d0717" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Sacred mountain sunrise */}
          <circle cx="100" cy="86" r="42" fill="#fde047" opacity="0.28" />
          <path d="M8 148 L58 84 L102 128 L148 76 L192 148 Z" fill="#1e1233" opacity="0.9" />

          {/* Diagonal carved hunting spear */}
          <line x1="34" y1="194" x2="164" y2="28" stroke="#d4aa5a" strokeWidth="3.8" strokeLinecap="round" />
          <polygon points="158,34 176,16 170,40" fill="#f8fafc" stroke="#f7cd6d" strokeWidth="1" />
          <path d="M150 48 Q162 56 154 68" fill="none" stroke="#dc2626" strokeWidth="3.2" strokeLinecap="round" />

          {/* Feathered warrior headband */}
          <path d="M76 58 Q62 28 74 20 Q84 36 86 58 Z" fill="#f8fafc" stroke="#d4aa5a" strokeWidth="1" />
          <path d="M124 58 Q138 28 126 20 Q116 36 114 58 Z" fill="#f8fafc" stroke="#d4aa5a" strokeWidth="1" />
          <path d="M100 54 Q100 22 108 18 Q110 38 104 54 Z" fill="#ef4444" />

          {/* Warrior torso with woven diamond sash */}
          <path
            d="M44 200 L60 130 Q100 116 140 130 L156 200 Z"
            fill="#1f142e"
            stroke="#f7cd6d"
            strokeWidth="1.6"
          />
          <path d="M62 132 L134 198" stroke="#dc2626" strokeWidth="12" />
          <path d="M62 132 L134 198" stroke="#fde047" strokeWidth="2" strokeDasharray="5 5" />

          {/* Determined hunter face & headband */}
          <path d="M76 72 Q76 112 100 122 Q124 112 124 72 Z" fill="#d49e72" stroke="#2c160c" strokeWidth="1.6" />
          <rect x="74" y="64" width="52" height="11" rx="2" fill="#dc2626" stroke="#fde047" strokeWidth="1.4" />
          <path d="M84 88 H94 M106 88 H116" stroke="#1c0f0a" strokeWidth="2.4" strokeLinecap="round" />

          <TempleCornerMotifs accent="#c084fc" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 6: 澎湖玄武舟師 (penghu_mariner)
       Basalt sea cliff silhouette, trident/oar, twin-heart stone weir & emerald sea spray
       ====================================================================== */
    case 'penghu_mariner':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="澎湖玄武舟師">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.82" />
              <stop offset="44%" stopColor="#0369a1" />
              <stop offset="82%" stopColor="#0b1e2e" />
              <stop offset="100%" stopColor="#061018" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Penghu Hexagonal Basalt Sea Cliffs (柱狀玄武岩) */}
          <g fill="#1e293b" stroke="#64748b" strokeWidth="1">
            <rect x="14" y="54" width="12" height="96" />
            <rect x="26" y="42" width="12" height="108" />
            <rect x="38" y="66" width="12" height="84" />
            <rect x="150" y="62" width="12" height="88" />
            <rect x="162" y="46" width="12" height="104" />
            <rect x="174" y="58" width="12" height="92" />
          </g>

          {/* Twin-Heart Stone Weir (雙心石滬) glowing emblem in sea */}
          <path
            d="M100 178 C84 166 76 154 88 148 C96 144 100 152 100 154 C100 152 104 144 112 148 C124 154 116 166 100 178 Z"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="2.4"
            opacity="0.85"
          />

          {/* Mariner armor & island cloak */}
          <path
            d="M48 200 L64 128 Q100 116 136 128 L152 200 Z"
            fill="#0f2940"
            stroke="#6ee7b7"
            strokeWidth="1.6"
          />
          <circle cx="100" cy="84" r="23" fill="#dcb890" stroke="#0f172a" strokeWidth="1.6" />
          {/* Naval brass helmet */}
          <path d="M72 78 Q100 46 128 78 Z" fill="#334155" stroke="#f7cd6d" strokeWidth="1.8" />
          <path d="M100 50 V76" stroke="#f7cd6d" strokeWidth="2.2" />

          {/* Sea Trident / Heavy Oar */}
          <g stroke="#f7cd6d" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <line x1="154" y1="36" x2="146" y2="192" />
            <path d="M142 54 Q154 64 166 54" />
            <line x1="142" y1="54" x2="144" y2="34" />
            <line x1="166" y1="54" x2="164" y2="34" />
          </g>

          <TempleCornerMotifs accent="#34d399" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 7: 客家義民長槍手 (hakka_pikeman)
       Indigo tunic Hakka militia warrior with long bamboo-steel pike & red Yimin temple banner
       ====================================================================== */
    case 'hakka_pikeman':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="客家義民長槍手">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="50%" cy="40%" r="68%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.72" />
              <stop offset="44%" stopColor="#1e3a5f" />
              <stop offset="82%" stopColor="#0f1b2b" />
              <stop offset="100%" stopColor="#080e17" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Red Yimin Temple Banner (義民旗) */}
          <path
            d="M24 26 H78 L68 78 L24 88 Z"
            fill="#b91c1c"
            stroke="#f7cd6d"
            strokeWidth="1.6"
          />
          <circle cx="48" cy="54" r="11" fill="none" stroke="#fde68a" strokeWidth="1.6" />
          <line x1="24" y1="22" x2="24" y2="192" stroke="#d4aa5a" strokeWidth="2.6" />

          {/* Long Bamboo-Steel Pike (長槍) with crimson tassel */}
          <line x1="146" y1="196" x2="160" y2="28" stroke="#a3e635" strokeWidth="4" strokeLinecap="round" />
          <polygon points="154,32 162,12 167,34" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          <path d="M158 36 Q172 48 164 62 Q156 52 158 36 Z" fill="#dc2626" />

          {/* Traditional Hakka Indigo Tunic (客家藍衫) */}
          <path
            d="M44 200 L60 128 Q100 116 140 128 L156 200 Z"
            fill="#1e3a8a"
            stroke="#93c5fd"
            strokeWidth="1.6"
          />
          {/* Crossed right-lapel white trim & frog buttons */}
          <path d="M84 126 L124 146 V200" fill="none" stroke="#e2e8f0" strokeWidth="2.2" />
          <line x1="118" y1="154" x2="128" y2="154" stroke="#f7cd6d" strokeWidth="2" />
          <line x1="118" y1="168" x2="128" y2="168" stroke="#f7cd6d" strokeWidth="2" />

          {/* Steadfast Hakka militia warrior head & rattan hat */}
          <path d="M56 76 Q100 44 144 76 Z" fill="#854d0e" stroke="#f7cd6d" strokeWidth="1.6" />
          <circle cx="100" cy="88" r="22" fill="#e2be96" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M86 88 H95 M105 88 H114" stroke="#0f172a" strokeWidth="2.3" strokeLinecap="round" />

          <TempleCornerMotifs accent="#84cc16" gold="#f7cd6d" />
        </svg>
      );

    /* ======================================================================
       R 8: 蘭陽拓荒先鋒 (lanyang_pioneer)
       Pioneer surveyor with glowing oil lantern, Guishan Island silhouette across Lanyang misty bay
       ====================================================================== */
    case 'lanyang_pioneer':
      return (
        <svg viewBox="0 0 200 200" className={className} aria-label="吳沙・蘭陽拓荒先鋒">
          <defs>
            <radialGradient id={`${uid}-bg`} cx="68%" cy="46%" r="66%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#0d9488" />
              <stop offset="76%" stopColor="#0f2930" />
              <stop offset="100%" stopColor="#071317" />
            </radialGradient>
          </defs>

          <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

          {/* Lanyang Misty Bay & Iconic Guishan Island (龜山島) silhouette */}
          <path
            d="M18 112 Q36 96 58 100 Q72 86 92 98 Q106 106 116 112 Z"
            fill="#134e4a"
            stroke="#5eead4"
            strokeWidth="1"
            opacity="0.85"
          />
          <line x1="10" y1="114" x2="190" y2="114" stroke="#99f6e4" strokeWidth="1.2" opacity="0.4" />

          {/* Pioneer cloak & surveyor hat */}
          <path
            d="M36 200 L54 128 Q94 114 134 128 L150 200 Z"
            fill="#1f2937"
            stroke="#5eead4"
            strokeWidth="1.6"
          />
          <path d="M52 76 Q92 48 132 76 Q92 84 52 76 Z" fill="#475569" stroke="#f7cd6d" strokeWidth="1.6" />
          <circle cx="92" cy="88" r="22" fill="#e5c59c" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M80 88 H88 M96 88 H104" stroke="#0f172a" strokeWidth="2.1" strokeLinecap="round" />

          {/* Held Glowing Pioneer Oil Lantern lighting the mist */}
          <g transform="translate(152, 118)">
            <circle cx="0" cy="0" r="28" fill="#fde047" opacity="0.22" />
            <circle cx="0" cy="0" r="16" fill="#fbbf24" opacity="0.38" />
            <path d="M-10 -14 H10 L13 14 H-13 Z" fill="#fef08a" stroke="#92400e" strokeWidth="2" />
            <path d="M-12 -14 Q0 -24 12 -14" fill="none" stroke="#f7cd6d" strokeWidth="2" />
            <rect x="-14" y="14" width="28" height="5" rx="2" fill="#78350f" stroke="#f7cd6d" strokeWidth="1" />
            <ellipse cx="0" cy="0" rx="4" ry="7" fill="#fffbeb" />
          </g>

          <TempleCornerMotifs accent="#2dd4bf" gold="#f7cd6d" />
        </svg>
      );

    default:
      return null;
  }
};
