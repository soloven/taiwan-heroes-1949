export type DistrictId =
  | 'keelung'
  | 'taipei'
  | 'new_taipei'
  | 'taoyuan'
  | 'hsinchu_city'
  | 'hsinchu_county'
  | 'miaoli'
  | 'taichung'
  | 'changhua'
  | 'nantou'
  | 'yunlin'
  | 'chiayi_city'
  | 'chiayi_county'
  | 'tainan'
  | 'kaohsiung'
  | 'pingtung'
  | 'yilan'
  | 'hualien'
  | 'taitung'
  | 'penghu'
  | 'kinmen'
  | 'lienchiang'
  | 'ningde'
  | 'fuzhou'
  | 'putian'
  | 'quanzhou'
  | 'xiamen'
  | 'zhangzhou'
  | 'shantou';

export type RegionZone = 'north' | 'central' | 'south' | 'east' | 'islands' | 'mainland';

export type TerrainType = 'plain' | 'mountain' | 'port' | 'basin' | 'island';

export type FactionId =
  | 'player'
  | 'north_alliance'
  | 'central_guild'
  | 'south_pirates'
  | 'east_guardians'
  | 'mainland_command'
  | 'neutral';

export type Rarity = 'R' | 'SR' | 'SSR';

export type UnitType = 'infantry' | 'cavalry' | 'archer' | 'naval';

export type SkillVisualType =
  | 'wave'
  | 'heal'
  | 'assassinate'
  | 'quake'
  | 'lightning'
  | 'volley';

export type WeaponStyle = 'sword' | 'spear' | 'bow' | 'fan' | 'axe' | 'dagger';

export type BattleFormation = 'wedge' | 'square' | 'echelon';

export type CropId =
  | 'rice'
  | 'tea'
  | 'pineapple'
  | 'mango'
  | 'sugar_apple'
  | 'sugarcane'
  | 'sweet_potato'
  | 'peanut';

export type BuildingType = 'granary' | 'barracks' | 'wall' | 'market';

export interface FactionConfig {
  id: FactionId;
  name: string;
  leaderName: string;
  color: string;
  lightColor: string;
  borderColor: string;
  description: string;
}

export interface DistrictConfig {
  id: DistrictId;
  name: string;
  shortName: string;
  zone: RegionZone;
  terrain: TerrainType;
  specialtyName: string;
  specialtyCrop: CropId;
  description: string;
  neighbors: DistrictId[];
  seaRoutes?: DistrictId[];
  baseFoodBonus: number;
  baseGoldBonus: number;
  baseDefense: number;
  initialFaction: FactionId;
  initialTroops: number;
  initialWallLevel: number;
  maxFarmPlots: number;
}

export interface CropConfig {
  id: CropId;
  name: string;
  seedCostGold: number;
  growTimeSec: number;
  foodYield: number;
  goldYield: number;
  description: string;
  color: string;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  maxLevel: number;
  baseGoldCost: number;
  baseFoodCost: number;
  description: string;
  effectPerLevel: string;
}

export interface HeroConfig {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  unitType: UnitType;
  originDistrict: DistrictId;
  /** RTK11 Five Stats (1-100) */
  might: number; // 武力
  command: number; // 統率
  intel: number; // 智力
  politics: number; // 政治
  charm: number; // 魅力
  /** Legacy/derived combat & farm helpers */
  atk: number;
  def: number;
  lead: number;
  farmBonus: number;
  /** Sango Heroes Battlefield Skill & Sprite Rig */
  skillName: string;
  skillDesc: string;
  skillType: SkillVisualType;
  skillCost: number; // MP cost (40-75)
  weaponStyle: WeaponStyle;
  initialStatus: 'garrison' | 'free';
  lore: string;
  portraitUrl?: string;
  themeColor: string;
  bondGroup: string;
}

export interface OfficerState {
  heroId: string;
  faction: FactionId | 'free';
  districtId: DistrictId | null;
  discovered: boolean;
  loyalty: number; // 0-100
  prisonerOf: FactionId | null;
  inMarchId: string | null;
  level: number;
  exp: number;
}

export interface FarmPlotState {
  plotIndex: number;
  cropId: CropId | null;
  plantedAt: number | null;
  matureAt: number | null;
  unlocked: boolean;
}

export interface DistrictState {
  id: DistrictId;
  faction: FactionId;
  troops: number;
  garrisonHeroIds: string[];
  buildings: Record<BuildingType, number>;
  plots: FarmPlotState[];
  morale: number;
}

export interface MarchOrder {
  id: string;
  faction: FactionId;
  fromId: DistrictId;
  toId: DistrictId;
  troops: number;
  heroIds: string[];
  startedAt: number;
  arriveAt: number;
  type: 'attack' | 'reinforce';
}

export interface PendingBattle {
  id: string;
  march: MarchOrder;
  defenderFaction: FactionId;
  defenderTroops: number;
  defenderHeroIds: string[];
  terrain: TerrainType;
}

export interface ManualBattleOutcome {
  attackerTroopsEnd: number;
  defenderTroopsEnd: number;
  winner: 'attacker' | 'defender';
  highlights: string[];
}

export interface CapturedPrisonerPrompt {
  battleId: string;
  districtId: DistrictId;
  heroIds: string[];
}

export interface BattleReport {
  id: string;
  timestamp: number;
  attackerFaction: FactionId;
  defenderFaction: FactionId;
  fromId: DistrictId;
  toId: DistrictId;
  attackerTroopsStart: number;
  attackerTroopsEnd: number;
  defenderTroopsStart: number;
  defenderTroopsEnd: number;
  attackerHeroIds: string[];
  defenderHeroIds: string[];
  winner: 'attacker' | 'defender';
  conquered: boolean;
  capturedHeroIds?: string[];
  lootGold: number;
  lootFood: number;
  highlights: string[];
}

export interface Resources {
  food: number;
  gold: number;
}

export interface HistoricalEventChoice {
  id: string;
  label: string;
  effectDesc: string;
  foodDelta?: number;
  goldDelta?: number;
  reputationDelta?: number;
  troopsDelta?: { districtId: DistrictId; amount: number };
  enemyAttack?: { fromId: DistrictId; toId: DistrictId; troops: number };
  moraleDelta?: number;
}

export interface HistoricalEventConfig {
  id: string;
  year: number;
  month: number;
  title: string;
  locationId: DistrictId;
  category: 'battle' | 'policy' | 'construction';
  summary: string;
  choices: HistoricalEventChoice[];
}

export interface ResolvedHistoricalEvent {
  eventId: string;
  year: number;
  month: number;
  choiceId: string;
  choiceLabel: string;
  outcomeText: string;
}

export type GameMode = 'story' | 'endless';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'hell';

export interface AutoModeConfig {
  enabled: boolean;
  autoFarm: boolean;
  autoRecruit: boolean;
  autoAttack: boolean;
}

export interface GameState {
  mode: GameMode;
  difficulty: DifficultyLevel;
  autoMode: AutoModeConfig;
  startingDistrictId: DistrictId;
  gameTime: number;
  paused: boolean;
  speed: 1 | 2 | 4;
  resources: Resources;
  reputation: number;
  districts: Record<DistrictId, DistrictState>;
  officers: Record<string, OfficerState>;
  marches: MarchOrder[];
  pendingBattle: PendingBattle | null;
  pendingPrisoners: CapturedPrisonerPrompt | null;
  battleReports: BattleReport[];
  activeEventIds: string[];
  resolvedEvents: ResolvedHistoricalEvent[];
  selectedDistrictId: DistrictId;
  victory: boolean;
  defeat: boolean;
  soundMuted: boolean;
  lastSavedAt: number;
}

export interface MapDistrictGeometry {
  id: DistrictId;
  path: string;
  labelX: number;
  labelY: number;
  insetBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
  };
}
