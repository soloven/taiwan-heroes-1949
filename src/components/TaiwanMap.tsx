import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type {
  DistrictId,
  DistrictState,
  FactionId,
  HistoricalEventConfig,
  MarchOrder,
  TerrainType,
  UnitType,
} from '../types/game';
import { FACTIONS } from '../data/factions';
import { DISTRICTS } from '../data/districts';
import { HEROES } from '../data/heroes';
import {
  MAINLAND_DIVIDER_PATHS,
  TAIWAN_ENCLAVE_IDS,
  TAIWAN_INLAND_BORDER_PATHS,
  TAIWAN_MAP_VIEWBOX,
  TAIWAN_MAP_GEOMETRIES,
  TAIWAN_MAP_RENDER_ORDER,
  TAIWAN_SEA_ROUTES,
} from '../data/taiwanMapPaths';
import { TaiwanLandmarkIcon, DISTRICT_LANDMARK_NAMES } from './TaiwanLandmarks';

export interface ActiveBattleEffect {
  id: string;
  targetId: DistrictId;
  fromId: DistrictId;
  attackerFaction: FactionId;
  winner: 'attacker' | 'defender';
  conquered: boolean;
  attackerLoss: number;
  defenderLoss: number;
  startedAtMs: number;
}

export interface TaiwanMapProps {
  districts: Record<DistrictId, DistrictState>;
  marches: MarchOrder[];
  selectedDistrictId: DistrictId;
  gameTime: number;
  onSelectDistrict: (id: DistrictId) => void;
  attackTargetIds?: DistrictId[];
  highlightNeighborIds?: DistrictId[];
  activeBattles?: ActiveBattleEffect[];
  onClearBattleEffect?: (id: string) => void;
  activeEvents?: HistoricalEventConfig[];
  onSelectEvent?: (eventId: string) => void;
}

const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: '平原',
  mountain: '山地',
  port: '港灣',
  basin: '盆地',
  island: '離島',
};

const OUTLYING_ISLANDS: DistrictId[] = ['lienchiang', 'kinmen', 'penghu'];

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.6;
const BATTLE_EFFECT_DURATION_MS = 2800;

/**
 * Soft translucent mountain-mist / cloud wisps gently drifting over the Central Mountain Range.
 */
const MOUNTAIN_CLOUD_WISPS: Array<{
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  durationSec: number;
  delaySec: number;
  variant: 'a' | 'b';
}> = [
  { id: 'mist-xueshan', x: 805, y: 325, scale: 1.08, opacity: 0.16, durationSec: 26, delaySec: 0, variant: 'a' },
  { id: 'mist-hehuan', x: 790, y: 428, scale: 1.2, opacity: 0.15, durationSec: 32, delaySec: -9, variant: 'b' },
  { id: 'mist-yushan', x: 755, y: 526, scale: 1.28, opacity: 0.18, durationSec: 28, delaySec: -16, variant: 'a' },
  { id: 'mist-dawu', x: 715, y: 675, scale: 0.96, opacity: 0.14, durationSec: 34, delaySec: -6, variant: 'b' },
];

const BATTLE_SPARK_VECTORS: Array<{ dx: number; dy: number; delay: number; gold: boolean }> = [
  { dx: 0, dy: -32, delay: 0, gold: true },
  { dx: 24, dy: -22, delay: 0.04, gold: false },
  { dx: 33, dy: 2, delay: 0.08, gold: true },
  { dx: 22, dy: 24, delay: 0.05, gold: false },
  { dx: 0, dy: 30, delay: 0.1, gold: true },
  { dx: -23, dy: 23, delay: 0.06, gold: false },
  { dx: -32, dy: -2, delay: 0.09, gold: true },
  { dx: -22, dy: -24, delay: 0.03, gold: false },
];

const CANNON_SMOKE_OFFSETS: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: -12, y: -6, r: 9, delay: 0.02 },
  { x: 13, y: -9, r: 10, delay: 0.08 },
  { x: -8, y: 11, r: 8, delay: 0.12 },
  { x: 11, y: 9, r: 8.5, delay: 0.06 },
];

function formatTroops(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.floor(n));
}

function getQuadraticPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

function getQuadraticTangent(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number
): { dx: number; dy: number } {
  const mt = 1 - t;
  return {
    dx: 2 * mt * (cx - x0) + 2 * t * (x1 - cx),
    dy: 2 * mt * (cy - y0) + 2 * t * (y1 - cy),
  };
}

function getCurveControlPoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): { cx: number; cy: number } {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = Math.min(48, Math.max(16, dist * 0.22));
  const nx = -dy / dist;
  const ny = dx / dist;
  return {
    cx: mx + nx * offset,
    cy: my + ny * offset,
  };
}

/**
 * Strictly checks whether a march traverses a sea route.
 * Land routes on Taiwan main island NEVER render a warship.
 */
function isSeaMarch(fromId: DistrictId, toId: DistrictId): boolean {
  return Boolean(
    DISTRICTS[fromId]?.seaRoutes?.includes(toId) ||
      DISTRICTS[toId]?.seaRoutes?.includes(fromId)
  );
}

function resolveMarchUnitType(march: MarchOrder): UnitType {
  if (isSeaMarch(march.fromId, march.toId)) {
    return 'naval';
  }
  const leadHeroId = march.heroIds[0];
  if (leadHeroId && HEROES[leadHeroId]) {
    const heroUnit = HEROES[leadHeroId].unitType;
    // On land, naval heroes (e.g. Koxinga, Mazu) march as infantry soldiers, never ships
    return heroUnit === 'naval' ? 'infantry' : heroUnit;
  }
  return 'infantry';
}

/**
 * Ornate Taiwanese Temple Jiannian (剪黏) Corner Bracket
 */
const JiannianCornerBracket: React.FC<{
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
}> = ({ x, y, scaleX = 1, scaleY = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scaleX}, ${scaleY})`} className="pointer-events-none">
    <path
      d="M 0 38 L 0 6 Q 0 0 6 0 L 38 0"
      fill="none"
      stroke="#d4a853"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M 5 30 L 5 8 Q 5 5 8 5 L 30 5"
      fill="none"
      stroke="#b91c1c"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M 9 21 Q 9 12 16 10 Q 20 9 21 14 Q 22 18 18 18 Q 14 18 14 14"
      fill="none"
      stroke="#fde68a"
      strokeWidth="1"
      strokeOpacity="0.8"
    />
    <polygon points="8,8 11.5,4.5 15,8 11.5,11.5" fill="#10b981" stroke="#fde68a" strokeWidth="0.65" />
    <circle cx={36} cy={0} r={1.6} fill="#fbbf24" />
    <circle cx={0} cy={36} r={1.6} fill="#fbbf24" />
  </g>
);

/**
 * Multi-Unit Animated Shadow-Puppet / War-Table Marching Squad Renderer
 */
const MarchingUnitSquad: React.FC<{
  unitType: UnitType;
  isAttack: boolean;
  factionColor: string;
  facingLeft: boolean;
}> = ({ unitType, isAttack, factionColor, facingLeft }) => {
  const bannerFill = isAttack ? '#dc2626' : '#059669';
  const accentGold = '#fcd34d';
  const silhouetteFill = '#120d0a';
  const glowColor = isAttack ? '#f97316' : '#34d399';

  return (
    <g transform={`scale(${facingLeft ? -1 : 1}, 1)`}>
      {/* Ground / water shadow aura */}
      <ellipse
        cx={0}
        cy={7.5}
        rx={unitType === 'naval' ? 15 : 13}
        ry={4.2}
        fill={glowColor}
        fillOpacity="0.28"
      />
      <ellipse
        cx={0}
        cy={7}
        rx={unitType === 'naval' ? 12 : 10}
        ry={3}
        fill="#05080f"
        fillOpacity="0.55"
      />

      {unitType === 'infantry' && (
        <g className="animate-march-bob">
          {/* Fluttering War Banner */}
          <g transform="translate(-5, -18)">
            <line x1={0} y1={0} x2={0} y2={20} stroke={accentGold} strokeWidth="1.3" />
            <path
              d="M 0 1 Q -7 3 -12 1.5 Q -9 5.5 -13 9 Q -6 7.5 0 9 Z"
              fill={bannerFill}
              stroke={accentGold}
              strokeWidth="0.7"
              className="animate-banner-flutter"
            />
          </g>

          {/* 3-Soldier Shield & Spear Phalanx */}
          {[-7, -1, 5].map((ox, idx) => (
            <g key={ox} transform={`translate(${ox}, ${idx === 1 ? -1.5 : 0.5})`}>
              <line
                x1={-1}
                y1={2}
                x2={7.5}
                y2={-8.5}
                stroke="#d6b474"
                strokeWidth="1.15"
                strokeLinecap="round"
              />
              <polygon points="7.5,-8.5 10,-10.5 8.5,-6.8" fill="#fef3c7" />
              <circle cx={0} cy={-5.5} r={2.3} fill={silhouetteFill} stroke={accentGold} strokeWidth="0.6" />
              <path
                d="M -2.4 -3 L 2.4 -3 L 3 4.5 L -3 4.5 Z"
                fill={silhouetteFill}
                stroke={factionColor}
                strokeWidth="0.7"
              />
              <circle
                cx={2.6}
                cy={0.5}
                r={3.1}
                fill="#78350f"
                stroke={accentGold}
                strokeWidth="0.8"
              />
              <circle cx={2.6} cy={0.5} r={1.1} fill={bannerFill} />
            </g>
          ))}
        </g>
      )}

      {unitType === 'cavalry' && (
        <g className="animate-march-bob">
          <circle cx={-12} cy={5.5} r={2.6} fill="#d6b474" fillOpacity="0.45" className="animate-ember-pulse" />
          <circle cx={-16} cy={4} r={1.9} fill="#fef3c7" fillOpacity="0.32" className="animate-ember-pulse" />
          <path
            d="M -2 -8 Q -9 -10 -15 -6 Q -11 -4 -14 -2 Q -7 -5 -2 -5 Z"
            fill={bannerFill}
            stroke={accentGold}
            strokeWidth="0.55"
            className="animate-banner-flutter"
          />
          <path
            d="M -8 1 Q -5 -4 2 -4 L 7 -9 L 11 -8 L 9 -3 Q 11 0 7 2 L 10 6.5 L 7.5 7 L 4.5 2.5 L -2.5 2.5 L -6.5 7 L -9 6 L -6 2 Z"
            fill={silhouetteFill}
            stroke={accentGold}
            strokeWidth="0.85"
            strokeLinejoin="round"
          />
          <circle cx={0} cy={-10.5} r={2.5} fill={silhouetteFill} stroke={accentGold} strokeWidth="0.7" />
          <path d="M -2.5 -8 L 2.5 -8 L 2 -2.5 L -2 -2.5 Z" fill={factionColor} stroke={accentGold} strokeWidth="0.6" />
          <line x1={-3} y1={-5} x2={13} y2={-13} stroke="#fde68a" strokeWidth="1.35" strokeLinecap="round" />
          <path d="M 11 -12 L 15 -14.5 L 13.5 -10.5 Z" fill="#fef3c7" />
        </g>
      )}

      {unitType === 'archer' && (
        <g className="animate-march-bob">
          <line
            x1={7}
            y1={-4}
            x2={18}
            y2={-8}
            stroke={isAttack ? '#fca5a5' : '#6ee7b7'}
            strokeWidth="1.4"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
          <polygon points="18,-8 15,-9.5 15.8,-6.2" fill="#fef08a" />
          {[
            { ox: -5.5, oy: -1.5 },
            { ox: 1.5, oy: 0.5 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.ox}, ${b.oy})`}>
              <circle cx={0} cy={-6} r={2.3} fill={silhouetteFill} stroke={accentGold} strokeWidth="0.65" />
              <path
                d="M -2.4 -3.5 L 2.4 -3.5 L 3 4.5 L -3 4.5 Z"
                fill={silhouetteFill}
                stroke={factionColor}
                strokeWidth="0.75"
              />
              <path
                d="M 2.5 -6.5 Q 7.5 -2 2.5 2.5"
                fill="none"
                stroke={accentGold}
                strokeWidth="1.25"
                strokeLinecap="round"
              />
              <line x1={2.5} y1={-6.5} x2={2.5} y2={2.5} stroke="#fef3c7" strokeWidth="0.45" strokeOpacity="0.8" />
              <line x1={1.5} y1={-2} x2={7.5} y2={-3.5} stroke="#fde047" strokeWidth="0.9" />
            </g>
          ))}
        </g>
      )}

      {unitType === 'naval' && (
        <g className="animate-march-bob">
          <path
            d="M -17 6.5 Q -10 8.5 -3 6.5 T 11 6.5"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="1.2"
            strokeOpacity="0.78"
            strokeLinecap="round"
            className="animate-wake-ripple"
          />
          <path
            d="M -14 9 Q -7 10.5 0 9 T 12 9"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="0.9"
            strokeOpacity="0.52"
            strokeLinecap="round"
            className="animate-wake-ripple"
          />
          <path
            d="M -12 1 L -10 -3 L -4 -2 L 7 -2 L 13 -4.5 L 10 4.5 L -9 4.5 Z"
            fill="#451a03"
            stroke={accentGold}
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <line x1={-9.5} y1={0.5} x2={10.5} y2={-0.5} stroke={bannerFill} strokeWidth="1.4" />
          <line x1={0} y1={-2} x2={0} y2={-17} stroke="#d6b474" strokeWidth="1.2" />
          <path
            d="M -1 -15 Q 6 -13 8 -4 L -3 -4 Q -4 -10 -1 -15 Z"
            fill="#fef3c7"
            fillOpacity="0.94"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          <line x1={-2} y1={-11.5} x2={5.5} y2={-11} stroke="#92400e" strokeWidth="0.65" />
          <line x1={-2.8} y1={-8} x2={6.8} y2={-7.5} stroke="#92400e" strokeWidth="0.65" />
          <path
            d="M -7 -11 Q -3 -9.5 -3 -3.5 L -9 -3.5 Z"
            fill={bannerFill}
            fillOpacity="0.9"
            stroke={accentGold}
            strokeWidth="0.65"
          />
          <path
            d="M 0 -17 L -7 -15.5 L 0 -14 Z"
            fill={bannerFill}
            className="animate-banner-flutter"
          />
        </g>
      )}
    </g>
  );
};

export const TaiwanMap: React.FC<TaiwanMapProps> = ({
  districts,
  marches,
  selectedDistrictId,
  gameTime,
  onSelectDistrict,
  attackTargetIds = [],
  highlightNeighborIds = [],
  activeBattles = [],
  onClearBattleEffect,
  activeEvents = [],
  onSelectEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const zoomRef = useRef<number>(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    active: boolean;
    initialDist: number;
    initialZoom: number;
  }>({
    active: false,
    initialDist: 0,
    initialZoom: 1,
  });
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
  });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const [hoveredId, setHoveredId] = useState<DistrictId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { width: vbW, height: vbH } = TAIWAN_MAP_VIEWBOX;

  const clampPan = useCallback(
    (nextX: number, nextY: number, currentZoom: number): { x: number; y: number } => {
      if (currentZoom <= 1.001) return { x: 0, y: 0 };
      const maxX = ((currentZoom - 1) * vbW) * 0.48;
      const maxY = ((currentZoom - 1) * vbH) * 0.48;
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [vbW, vbH]
  );

  // Optional auto-clear timer support when parent delegates expiration via onClearBattleEffect
  useEffect(() => {
    if (!onClearBattleEffect || activeBattles.length === 0) return;
    const now = Date.now();
    const timers = activeBattles.map((battle) => {
      const remaining = Math.max(80, BATTLE_EFFECT_DURATION_MS - (now - battle.startedAtMs));
      return window.setTimeout(() => {
        onClearBattleEffect(battle.id);
      }, remaining);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [activeBattles, onClearBattleEffect]);

  const attackTargetSet = useMemo(
    () => new Set<DistrictId>(attackTargetIds),
    [attackTargetIds]
  );
  const neighborHighlightSet = useMemo(
    () => new Set<DistrictId>(highlightNeighborIds),
    [highlightNeighborIds]
  );

  const handleZoomBy = useCallback(
    (delta: number) => {
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prev + delta).toFixed(2)));
        zoomRef.current = next;
        setPan((curPan) => {
          const nextPan = next <= 1.001 ? { x: 0, y: 0 } : clampPan(curPan.x, curPan.y, next);
          panRef.current = nextPan;
          return nextPan;
        });
        return next;
      });
    },
    [clampPan]
  );

  const handleResetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    activePointersRef.current.clear();
    pinchStateRef.current.active = false;
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    dragStateRef.current.moved = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      handleZoomBy(delta);
    },
    [handleZoomBy]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on floating zoom buttons
    if ((e.target as HTMLElement)?.closest('button')) return;

    const pointers = activePointersRef.current;
    if (pointers.size === 0) {
      dragStateRef.current.moved = false;
    }

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      // Begin 2-finger pinch-to-zoom
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStateRef.current = {
        active: true,
        initialDist: Math.max(1, dist),
        initialZoom: zoomRef.current,
      };
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
      dragStateRef.current.moved = true;
      setIsDragging(false);
      return;
    }

    if (pointers.size === 1 && zoomRef.current > 1.001) {
      // Begin single-finger / mouse pan when zoomed in
      dragStateRef.current = {
        active: true,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        moved: false,
      };
      setIsDragging(true);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (e.pointerType === 'mouse') {
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      const pointers = activePointersRef.current;
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // 2-pointer Pinch-to-Zoom
      if (pointers.size === 2 && pinchStateRef.current.active) {
        const pts = Array.from(pointers.values());
        const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const ratio = newDist / Math.max(1, pinchStateRef.current.initialDist);
        const nextZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, +(pinchStateRef.current.initialZoom * ratio).toFixed(3))
        );
        zoomRef.current = nextZoom;
        setZoom(nextZoom);

        const nextPan =
          nextZoom <= 1.001
            ? { x: 0, y: 0 }
            : clampPan(panRef.current.x, panRef.current.y, nextZoom);
        panRef.current = nextPan;
        setPan(nextPan);
        dragStateRef.current.moved = true;
        return;
      }

      // 1-pointer Single-Finger / Mouse Pan (when zoomed > 1.0)
      if (
        pointers.size === 1 &&
        dragStateRef.current.active &&
        dragStateRef.current.pointerId === e.pointerId &&
        zoomRef.current > 1.001
      ) {
        const dxPx = e.clientX - dragStateRef.current.startClientX;
        const dyPx = e.clientY - dragStateRef.current.startClientY;
        const movedPx = Math.hypot(dxPx, dyPx);
        if (movedPx <= 6 && !dragStateRef.current.moved) {
          return;
        }
        dragStateRef.current.moved = true;

        // Convert screen pixel delta into SVG viewBox units
        const scaleToVb = Math.max(
          vbW / Math.max(1, rect.width),
          vbH / Math.max(1, rect.height)
        );
        const nextPan = clampPan(
          dragStateRef.current.startPanX + dxPx * scaleToVb,
          dragStateRef.current.startPanY + dyPx * scaleToVb,
          zoomRef.current
        );
        panRef.current = nextPan;
        setPan(nextPan);
      }
    },
    [vbW, vbH, clampPan]
  );

  const handlePointerUpOrCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pointers = activePointersRef.current;
    pointers.delete(e.pointerId);

    if (pointers.size < 2) {
      pinchStateRef.current.active = false;
    }

    if (pointers.size === 1 && zoomRef.current > 1.001) {
      // Smoothly re-anchor single remaining finger after pinch
      const [[remId, remPos]] = Array.from(pointers.entries());
      dragStateRef.current = {
        active: true,
        pointerId: remId,
        startClientX: remPos.x,
        startClientY: remPos.y,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        moved: true,
      };
      setIsDragging(true);
      return;
    }

    if (pointers.size === 0) {
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
      setIsDragging(false);
    }
  }, []);

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      activePointersRef.current.delete(e.pointerId);
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
      setIsDragging(false);
      setHoveredId(null);
    }
  }, []);

  const handleDistrictClick = useCallback(
    (id: DistrictId) => {
      if (dragStateRef.current.moved) {
        dragStateRef.current.moved = false;
        return;
      }
      onSelectDistrict(id);
    },
    [onSelectDistrict]
  );

  const hasMatureCrop = useCallback(
    (state: DistrictState | undefined): boolean => {
      if (!state || state.faction !== 'player') return false;
      return state.plots.some(
        (plot) =>
          plot.unlocked &&
          plot.cropId !== null &&
          plot.matureAt !== null &&
          gameTime >= plot.matureAt
      );
    },
    [gameTime]
  );

  const hasPlantedCrop = useCallback(
    (state: DistrictState | undefined): boolean => {
      if (!state) return false;
      return state.plots.some((plot) => plot.unlocked && plot.cropId !== null);
    },
    []
  );

  const hoveredConfig = hoveredId ? DISTRICTS[hoveredId] : null;
  const hoveredState = hoveredId ? districts[hoveredId] : null;
  const hoveredFaction = hoveredState ? FACTIONS[hoveredState.faction] : null;
  const hoveredLandmark = hoveredId ? DISTRICT_LANDMARK_NAMES[hoveredId] : null;

  const containerWidth = containerRef.current?.clientWidth ?? 680;
  const containerHeight = containerRef.current?.clientHeight ?? 700;
  const tooltipLeft = Math.min(
    Math.max(12, tooltipPos.x + 16),
    Math.max(12, containerWidth - 242)
  );
  const tooltipTop = Math.min(
    Math.max(12, tooltipPos.y - 12),
    Math.max(12, containerHeight - 185)
  );

  const isPannable = zoom > 1.001;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-full min-w-0 min-h-0 touch-none overflow-hidden select-none rounded-xl border-2 border-[#b4833e]/80 bg-[#17384c] shadow-[0_0_28px_rgba(0,0,0,0.75),inset_0_0_22px_rgba(23,56,76,0.45)] ring-1 ring-inset ring-amber-300/20 ${
        isPannable ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      {/* Subtle carved wood inner trim */}
      <div className="pointer-events-none absolute inset-0 z-[5] rounded-[10px] border-[2px] border-[#2d170b]/70" />

      {/* Inline SVG animation styles */}
      <style>{`
        @keyframes mapAttackPulse {
          0%, 100% { stroke-opacity: 0.92; stroke-width: 1.4px; }
          50% { stroke-opacity: 0.45; stroke-width: 2.1px; }
        }
        @keyframes cloudDriftA {
          0% { transform: translate(-20px, 5px); opacity: 0; }
          18% { opacity: 1; }
          82% { opacity: 1; }
          100% { transform: translate(24px, -8px); opacity: 0; }
        }
        @keyframes cloudDriftB {
          0% { transform: translate(18px, 6px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(-22px, -7px); opacity: 0; }
        }
        @keyframes marchDashFlow {
          to { stroke-dashoffset: -28; }
        }
        @keyframes sproutBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.8px); }
        }
        @keyframes marchBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2.2px) rotate(-2deg); }
          50% { transform: translateY(0.5px) rotate(0deg); }
          75% { transform: translateY(-1.8px) rotate(2deg); }
        }
        @keyframes bannerFlutter {
          0%, 100% { transform: skewY(0deg) scaleX(1); }
          50% { transform: skewY(-6deg) scaleX(0.9); }
        }
        @keyframes emberPulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(0.7); }
        }
        @keyframes wakeRipple {
          0%, 100% { stroke-opacity: 0.78; transform: translateX(0px); }
          50% { stroke-opacity: 0.35; transform: translateX(-2px); }
        }
        @keyframes lanternPulse {
          0%, 100% { opacity: 0.92; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.14); }
        }
        @keyframes battleShockwave {
          0% { transform: scale(0.2); opacity: 0.98; stroke-width: 4.5px; }
          60% { opacity: 0.65; }
          100% { transform: scale(2.35); opacity: 0; stroke-width: 0.8px; }
        }
        @keyframes swordSlashA {
          0% { transform: scale(0.3) rotate(-42deg) translateX(-14px); opacity: 0; }
          18% { transform: scale(1.15) rotate(-42deg) translateX(0px); opacity: 1; }
          45% { transform: scale(1.05) rotate(-42deg) translateX(4px); opacity: 0.85; }
          100% { transform: scale(1.25) rotate(-42deg) translateX(8px); opacity: 0; }
        }
        @keyframes swordSlashB {
          0% { transform: scale(0.3) rotate(42deg) translateX(14px); opacity: 0; }
          12% { opacity: 0; }
          28% { transform: scale(1.15) rotate(42deg) translateX(0px); opacity: 1; }
          58% { transform: scale(1.05) rotate(42deg) translateX(-4px); opacity: 0.85; }
          100% { transform: scale(1.25) rotate(42deg) translateX(-8px); opacity: 0; }
        }
        @keyframes battleSpark {
          0% { transform: translate(0px, 0px) scale(1.1); opacity: 1; }
          70% { opacity: 0.85; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
        }
        @keyframes cannonSmoke {
          0% { transform: scale(0.35); opacity: 0.78; }
          55% { transform: scale(1.35); opacity: 0.42; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes battleCallout {
          0% { transform: translateY(8px) scale(0.72); opacity: 0; }
          16% { transform: translateY(-4px) scale(1.06); opacity: 1; }
          75% { transform: translateY(-20px) scale(1); opacity: 1; }
          100% { transform: translateY(-32px) scale(0.95); opacity: 0; }
        }
        @keyframes eventBadgePulse {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.06); }
        }
        @keyframes eventRingExpand {
          0% { transform: scale(0.85); opacity: 0.9; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .attack-pulse {
          animation: mapAttackPulse 1.6s ease-in-out infinite;
        }
        .march-dash {
          animation: marchDashFlow 1.1s linear infinite;
        }
        .sprout-bob {
          animation: sproutBob 1.7s ease-in-out infinite;
        }
        .animate-march-bob {
          animation: marchBob 0.72s ease-in-out infinite;
        }
        .animate-banner-flutter {
          transform-box: fill-box;
          transform-origin: right center;
          animation: bannerFlutter 0.65s ease-in-out infinite;
        }
        .animate-ember-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: emberPulse 0.9s ease-in-out infinite;
        }
        .animate-wake-ripple {
          animation: wakeRipple 0.95s ease-in-out infinite;
        }
        .animate-lantern-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: lanternPulse 1.9s ease-in-out infinite;
        }
        .animate-battle-shockwave {
          transform-box: fill-box;
          transform-origin: center;
          animation: battleShockwave 1.15s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .animate-battle-shockwave-delayed {
          transform-box: fill-box;
          transform-origin: center;
          animation: battleShockwave 1.15s cubic-bezier(0.16, 1, 0.3, 1) 0.36s infinite;
        }
        .animate-sword-slash-a {
          transform-box: fill-box;
          transform-origin: center;
          animation: swordSlashA 0.95s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .animate-sword-slash-b {
          transform-box: fill-box;
          transform-origin: center;
          animation: swordSlashB 0.95s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .animate-battle-spark {
          transform-box: fill-box;
          transform-origin: center;
          animation: battleSpark 0.9s ease-out infinite;
        }
        .animate-cannon-smoke {
          transform-box: fill-box;
          transform-origin: center;
          animation: cannonSmoke 1.25s ease-out infinite;
        }
        .animate-battle-callout {
          animation: battleCallout 2.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-event-badge {
          transform-box: fill-box;
          transform-origin: center;
          animation: eventBadgePulse 1.8s ease-in-out infinite;
        }
        .animate-event-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: eventRingExpand 1.9s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>

      {/* Main Interactive SVG Map (Always Centered, Zoom-Only from exact center 410, 430) */}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-full block touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Calm serene ocean fallback gradient */}
          <linearGradient id="ocean-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a52" />
            <stop offset="50%" stopColor="#244660" />
            <stop offset="100%" stopColor="#1e3a52" />
          </linearGradient>

          {/* Warm cartouche backlight */}
          <radialGradient id="lantern-cartouche-glow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#b45309" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1e3a52" stopOpacity="0" />
          </radialGradient>

          {/* Talisman-fire trail gradient (attack) */}
          <linearGradient id="talisman-fire-attack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#ef4444" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
          </linearGradient>

          {/* Jade-spirit trail gradient (reinforce) */}
          <linearGradient id="talisman-fire-reinforce" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d1fae5" stopOpacity="1" />
          </linearGradient>

          {/* Wooden-Gold War Token gradient for troop pill badges */}
          <linearGradient id="wood-token-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#26170e" />
            <stop offset="55%" stopColor="#180e08" />
            <stop offset="100%" stopColor="#100905" />
          </linearGradient>

          {/* Soft gaussian blur for drifting Central Mountain Range cloud wisps */}
          <filter id="cloud-mist-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>

          {/* Subtle warm gold glow for selected district */}
          <filter id="selected-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2.4"
              floodColor="#fbbf24"
              floodOpacity="0.72"
            />
          </filter>

          {/* Glowing talisman-fire / ember / battle VFX bloom */}
          <filter id="ember-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrowhead markers for marching routes */}
          <marker
            id="arrow-attack"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
          </marker>
          <marker
            id="arrow-reinforce"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
          </marker>
        </defs>

        {/* Ocean Backdrop */}
        <rect x={0} y={0} width={vbW} height={vbH} fill="url(#ocean-bg)" />

        {/* Centered Transform Group (locked at 100%; smooth drag-to-pan unlocked when zoom > 1.0) */}
        <g
          transform={`translate(${vbW / 2 + pan.x}, ${vbH / 2 + pan.y}) scale(${zoom}) translate(${-vbW / 2}, ${-vbH / 2})`}
        >
          {/* Edition 5: 1949 Classical Parchment Relief Oil-Painted Base Map */}
          <image
            href="./assets/map-editions/map_golden.jpg"
            x={0}
            y={0}
            width={TAIWAN_MAP_VIEWBOX.width}
            height={TAIWAN_MAP_VIEWBOX.height}
            preserveAspectRatio="none"
            className="pointer-events-none"
            style={{ filter: 'sepia(0.52) contrast(1.08) saturate(0.78) brightness(1.03)' }}
          />

          {/* Subtle Tropic of Cancer dashed line (23.5°N -> y ≈ 556) */}
          <g opacity="0.28" className="pointer-events-none">
            <line
              x1={200}
              y1={556}
              x2={980}
              y2={556}
              stroke="#fde68a"
              strokeWidth="0.95"
              strokeDasharray="7 5"
            />
            <text
              x={974}
              y={548}
              textAnchor="end"
              fill="#fef3c7"
              fontSize="11"
              letterSpacing="1"
            >
              北回歸線 23.5°N
            </text>
          </g>

          {/* Sea Watermarks: Taiwan Strait, Pacific Ocean, Bashi Channel */}
          <g
            className="pointer-events-none"
            fontFamily="'Noto Serif TC', 'Songti TC', 'PMingLiU', Georgia, serif"
          >
            <text
              x={352}
              y={415}
              textAnchor="middle"
              fill="#fffbeb"
              fillOpacity="0.48"
              fontSize="17"
              fontWeight="700"
              letterSpacing="7"
              writingMode="tb"
            >
              臺灣海峽
            </text>
            <text
              x={944}
              y={520}
              fill="#e0f2fe"
              fillOpacity="0.36"
              fontSize="16.5"
              fontWeight="700"
              letterSpacing="6"
              writingMode="tb"
            >
              太平洋
            </text>
            <text
              x={704}
              y={964}
              textAnchor="middle"
              fill="#e0f2fe"
              fillOpacity="0.34"
              fontSize="14"
              fontWeight="700"
              letterSpacing="3.5"
            >
              巴士海峽
            </text>
          </g>

          {/* Delicate Curved Sea Routes Connecting True Island Coordinates to Taiwan's Coast */}
          <g
            fill="none"
            stroke="#fef3c7"
            strokeOpacity="0.48"
            strokeWidth="1.35"
            strokeDasharray="5 5"
            className="pointer-events-none"
          >
            {TAIWAN_SEA_ROUTES.map((route) => (
              <path key={route.id} d={route.d} />
            ))}
          </g>

          {/* Soft Clickable Halos for Outlying Island Archipelagos (Mazu, Kinmen, Penghu) */}
          <g>
            {OUTLYING_ISLANDS.map((islandId) => {
              const geom = TAIWAN_MAP_GEOMETRIES[islandId];
              const isSelected = selectedDistrictId === islandId;
              const isHovered = hoveredId === islandId;
              const isAttackTarget = attackTargetSet.has(islandId);
              const haloRadius = islandId === 'penghu' ? 38 : 34;
              return (
                <g key={`island-halo-${islandId}`}>
                  {!isSelected && (
                    <circle
                      cx={geom.labelX}
                      cy={geom.labelY}
                      r={haloRadius}
                      fill="none"
                      stroke="rgba(255, 248, 230, 0.45)"
                      strokeWidth={2.8}
                      className="pointer-events-none"
                    />
                  )}
                  <circle
                    cx={geom.labelX}
                    cy={geom.labelY}
                    r={haloRadius}
                    fill={isSelected ? '#fbbf24' : isHovered ? '#fef3c7' : '#e3bf76'}
                    fillOpacity={isSelected ? 0.18 : isHovered ? 0.14 : 0.06}
                    stroke={
                      isSelected
                        ? '#fbbf24'
                        : isAttackTarget
                        ? '#fb7185'
                        : '#141414'
                    }
                    strokeWidth={isSelected ? 2.0 : 1.6}
                    strokeDasharray={isSelected ? undefined : '6 4'}
                    onClick={() => handleDistrictClick(islandId)}
                    onMouseEnter={() => setHoveredId(islandId)}
                    onMouseLeave={() => setHoveredId((prev) => (prev === islandId ? null : prev))}
                    className="cursor-pointer transition-opacity duration-150"
                  />
                </g>
              );
            })}
          </g>

          {/* All 29 Interactive Territory Polygons (Taiwan 22 + Mainland SE 7) */}
          <g>
            {TAIWAN_MAP_RENDER_ORDER.map((id) => {
              const geom = TAIWAN_MAP_GEOMETRIES[id];
              const state = districts[id];
              const faction = state ? FACTIONS[state.faction] : FACTIONS.neutral;
              const isSelected = selectedDistrictId === id;
              const isHovered = hoveredId === id;
              const isAttackTarget = attackTargetSet.has(id);
              const isNeighbor = neighborHighlightSet.has(id);

              const fillColor = faction?.color ?? '#475569';

              return (
                <g
                  key={id}
                  onClick={() => handleDistrictClick(id)}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === id ? null : prev))}
                  className="cursor-pointer transition-opacity duration-150"
                >
                  {/* Subtle translucent faction tint so painted plains, terraces & 3D peaks shine vividly */}
                  <path
                    d={geom.path}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.3 : isHovered ? 0.24 : 0.16}
                    stroke={
                      isNeighbor
                        ? 'rgba(253, 224, 71, 0.85)'
                        : isHovered
                        ? 'rgba(255, 250, 235, 0.72)'
                        : 'none'
                    }
                    strokeWidth={isNeighbor ? 1.6 : 1.2}
                    strokeLinejoin="round"
                  />

                  {/* Clean, elegant 2.2px warm gold outline for Selected District */}
                  {isSelected && (
                    <path
                      d={geom.path}
                      fill="none"
                      stroke="#fbbf24"
                      strokeOpacity="0.96"
                      strokeWidth="2.3"
                      strokeLinejoin="round"
                      filter="url(#selected-glow)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Subtle gentle dashed vermilion pulse for Attackable Enemy Neighbors */}
                  {isAttackTarget && (
                    <path
                      d={geom.path}
                      fill="#dc2626"
                      fillOpacity="0.12"
                      stroke="#f87171"
                      strokeWidth="1.8"
                      strokeDasharray="6 4"
                      strokeLinejoin="round"
                      className="pointer-events-none attack-pulse"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Crisp Black Dashed Administrative Divider Lines for ALL 29 Territories (Taiwan + Mainland SE) */}
          <g className="pointer-events-none" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Soft warm-ivory underlay so black dashes stay razor-sharp over dark terrain */}
            {MAINLAND_DIVIDER_PATHS.map((d, idx) => (
              <path
                key={`ml-div-under-${idx}`}
                d={d}
                stroke="rgba(255, 248, 230, 0.45)"
                strokeWidth="2.8"
              />
            ))}
            {TAIWAN_INLAND_BORDER_PATHS.map((d, idx) => (
              <path
                key={`tw-div-under-${idx}`}
                d={d}
                stroke="rgba(255, 248, 230, 0.45)"
                strokeWidth="2.8"
              />
            ))}
            {TAIWAN_ENCLAVE_IDS.map((enclaveId) => (
              <path
                key={`tw-enc-under-${enclaveId}`}
                d={TAIWAN_MAP_GEOMETRIES[enclaveId].path}
                stroke="rgba(255, 248, 230, 0.45)"
                strokeWidth="2.8"
              />
            ))}
            {/* Primary #141414 black dashed divider lines */}
            {MAINLAND_DIVIDER_PATHS.map((d, idx) => (
              <path
                key={`ml-div-dash-${idx}`}
                d={d}
                stroke="#141414"
                strokeWidth="1.6"
                strokeDasharray="6 4"
              />
            ))}
            {TAIWAN_INLAND_BORDER_PATHS.map((d, idx) => (
              <path
                key={`tw-div-dash-${idx}`}
                d={d}
                stroke="#141414"
                strokeWidth="1.6"
                strokeDasharray="6 4"
              />
            ))}
            {TAIWAN_ENCLAVE_IDS.map((enclaveId) => (
              <path
                key={`tw-enc-dash-${enclaveId}`}
                d={TAIWAN_MAP_GEOMETRIES[enclaveId].path}
                stroke="#141414"
                strokeWidth="1.6"
                strokeDasharray="6 4"
              />
            ))}
          </g>

          {/* Soft Slow-Drifting Translucent Mountain-Mist Clouds over Central Mountain Range */}
          <g className="pointer-events-none" filter="url(#cloud-mist-blur)">
            {MOUNTAIN_CLOUD_WISPS.map((cloud) => (
              <g
                key={cloud.id}
                transform={`translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`}
                opacity={cloud.opacity}
              >
                <g
                  style={{
                    animation: `${cloud.variant === 'a' ? 'cloudDriftA' : 'cloudDriftB'} ${cloud.durationSec}s ease-in-out ${cloud.delaySec}s infinite`,
                  }}
                >
                  <ellipse cx={0} cy={0} rx={24} ry={8.5} fill="#f8fafc" />
                  <ellipse cx={-11} cy={2.5} rx={15} ry={6.5} fill="#fef3c7" fillOpacity="0.82" />
                  <ellipse cx={13} cy={-2} rx={16} ry={6} fill="#ffffff" fillOpacity="0.88" />
                </g>
              </g>
            ))}
          </g>

          {/* Larger Authentic 22 Local Taiwan Landmarks, Bold Serif Labels & Crisp Troop Pills */}
          <g className="pointer-events-none">
            {TAIWAN_MAP_RENDER_ORDER.map((id) => {
              const geom = TAIWAN_MAP_GEOMETRIES[id];
              const config = DISTRICTS[id];
              const state = districts[id];
              if (!config || !state) return null;

              const faction = FACTIONS[state.faction] ?? FACTIONS.neutral;
              const isSelected = selectedDistrictId === id;
              const isSmallCity =
                id === 'taipei' ||
                id === 'keelung' ||
                id === 'hsinchu_city' ||
                id === 'chiayi_city';
              const matureReady = hasMatureCrop(state);
              const plantedCrop = hasPlantedCrop(state);
              const troopText = formatTroops(state.troops);
              const pillWidth = Math.max(48, troopText.length * 7.2 + 26);

              return (
                <g key={`label-${id}`}>
                  {/* Enlarged Authentic Local Taiwan Landmark Icon (30px) */}
                  <TaiwanLandmarkIcon
                    districtId={id}
                    x={geom.labelX - 15}
                    y={geom.labelY - 29}
                    size={30}
                  />

                  <g transform={`translate(${geom.labelX}, ${geom.labelY})`}>
                    {/* Subtle Golden Rice Terraces when district has planted crops */}
                    {plantedCrop && (
                      <g transform="translate(0, 26)" opacity={matureReady ? 0.94 : 0.68}>
                        <path
                          d="M -15 0 Q -7.5 -2.8 0 0 T 15 0"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.35"
                          strokeLinecap="round"
                        />
                        <path
                          d="M -11 3 Q -4 0.8 3 3 T 11.5 2.6"
                          fill="none"
                          stroke="#a3e635"
                          strokeWidth="1.05"
                          strokeOpacity="0.85"
                          strokeLinecap="round"
                        />
                      </g>
                    )}

                    {/* Enlarged Bold Serif District Name with Crisp Dark Halo */}
                    <text
                      x={0}
                      y={4.5}
                      textAnchor="middle"
                      fontSize={isSmallCity ? 13.5 : isSelected ? 15.5 : 14.5}
                      fontWeight="800"
                      letterSpacing="0.7"
                      fontFamily="'Noto Serif TC', 'Songti TC', 'PMingLiU', Georgia, serif"
                      fill={isSelected ? '#fef08a' : '#fffdf5'}
                      stroke="#14100b"
                      strokeOpacity="0.94"
                      strokeWidth="3.8"
                      paintOrder="stroke"
                    >
                      {config.shortName}
                    </text>

                    {/* Enlarged Clean Troop Pill Badge */}
                    <g transform={`translate(${-pillWidth / 2}, 8.5)`}>
                      <rect
                        x={0}
                        y={0}
                        width={pillWidth}
                        height={17}
                        rx={5}
                        fill="url(#wood-token-grad)"
                        fillOpacity="0.92"
                        stroke={isSelected ? '#fde047' : '#c9974c'}
                        strokeWidth={isSelected ? 1.4 : 0.95}
                      />
                      <circle
                        cx={7}
                        cy={8.5}
                        r={2.8}
                        fill={faction.color}
                        stroke="#fef3c7"
                        strokeWidth="0.6"
                      />
                      <text
                        x={pillWidth / 2 + 3.5}
                        y={12.2}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#fef3c7"
                      >
                        ⚔ {troopText}
                      </text>
                    </g>

                    {/* Glowing Floating Lantern-Sprout when crops are mature */}
                    {matureReady && (
                      <g transform={`translate(${pillWidth / 2 + 2.5}, -5)`}>
                        <g className="sprout-bob">
                          <circle
                            cx={6.5}
                            cy={6.5}
                            r={9}
                            fill="#fbbf24"
                            fillOpacity="0.24"
                            className="animate-lantern-pulse"
                          />
                          <circle
                            cx={6.5}
                            cy={6.5}
                            r={7.2}
                            fill="#064e3b"
                            stroke="#fcd34d"
                            strokeWidth="1.15"
                          />
                          <text x={6.5} y={9.5} textAnchor="middle" fontSize="8.5">
                            🌱
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </g>

          {/* Live Multi-Unit Animated Marching Armies */}
          <g className="pointer-events-none">
            {marches.map((march) => {
              const fromGeom = TAIWAN_MAP_GEOMETRIES[march.fromId];
              const toGeom = TAIWAN_MAP_GEOMETRIES[march.toId];
              if (!fromGeom || !toGeom) return null;

              const x0 = fromGeom.labelX;
              const y0 = fromGeom.labelY;
              const x1 = toGeom.labelX;
              const y1 = toGeom.labelY;
              const { cx, cy } = getCurveControlPoint(x0, y0, x1, y1);

              const duration = Math.max(0.001, march.arriveAt - march.startedAt);
              const progress = Math.max(
                0,
                Math.min(1, (gameTime - march.startedAt) / duration)
              );
              const pos = getQuadraticPoint(x0, y0, cx, cy, x1, y1, progress);
              const tangent = getQuadraticTangent(x0, y0, cx, cy, x1, y1, progress);
              const facingLeft = tangent.dx < 0;
              const remainingSec = Math.max(0, Math.ceil(march.arriveAt - gameTime));

              // De Casteljau sub-curve control point for traveled trail [0..progress]
              const trailCx = x0 + progress * (cx - x0);
              const trailCy = y0 + progress * (cy - y0);

              const unitType = resolveMarchUnitType(march);
              const isAttack = march.type === 'attack';
              const factionColor =
                FACTIONS[march.faction]?.color ?? (isAttack ? '#ef4444' : '#10b981');
              const strokeColor = isAttack ? '#f87171' : '#34d399';
              const trailGradient = isAttack
                ? 'url(#talisman-fire-attack)'
                : 'url(#talisman-fire-reinforce)';
              const badgeBorder = isAttack ? '#fca5a5' : '#6ee7b7';
              const markerId = isAttack ? 'url(#arrow-attack)' : 'url(#arrow-reinforce)';

              const emberOffsets = [0.045, 0.09, 0.145, 0.21];

              return (
                <g key={march.id}>
                  {/* Planned Curved Route */}
                  <path
                    d={`M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.8"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    markerEnd={markerId}
                    className="march-dash"
                    opacity="0.54"
                  />

                  {/* Glowing Talisman-Fire / Battle Trail behind squad */}
                  {progress > 0.01 && (
                    <g filter="url(#ember-glow)">
                      <path
                        d={`M ${x0} ${y0} Q ${trailCx} ${trailCy} ${pos.x} ${pos.y}`}
                        fill="none"
                        stroke={trailGradient}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        opacity="0.65"
                      />
                      <path
                        d={`M ${x0} ${y0} Q ${trailCx} ${trailCy} ${pos.x} ${pos.y}`}
                        fill="none"
                        stroke={isAttack ? '#fef08a' : '#a7f3d0'}
                        strokeWidth="1.4"
                        strokeDasharray="4 5"
                        strokeLinecap="round"
                        className="march-dash"
                        opacity="0.9"
                      />
                    </g>
                  )}

                  {/* Trailing Ember / Smoke Dots */}
                  {emberOffsets.map((step, idx) => {
                    const t = progress - step;
                    if (t <= 0.01) return null;
                    const ep = getQuadraticPoint(x0, y0, cx, cy, x1, y1, t);
                    const radius = Math.max(1.2, 3.0 - idx * 0.5);
                    return (
                      <circle
                        key={`ember-${march.id}-${idx}`}
                        cx={ep.x}
                        cy={ep.y}
                        r={radius}
                        fill={
                          isAttack
                            ? idx % 2 === 0
                              ? '#fbbf24'
                              : '#ef4444'
                            : idx % 2 === 0
                            ? '#6ee7b7'
                            : '#fde68a'
                        }
                        fillOpacity={Math.max(0.25, 0.85 - idx * 0.18)}
                        className="animate-ember-pulse"
                      />
                    );
                  })}

                  {/* Animated Directional Multi-Unit Squad */}
                  <g transform={`translate(${pos.x}, ${pos.y})`}>
                    <MarchingUnitSquad
                      unitType={unitType}
                      isAttack={isAttack}
                      factionColor={factionColor}
                      facingLeft={facingLeft}
                    />

                    {/* Troop Count & Remaining Time Pill */}
                    <g transform="translate(-28, 12)">
                      <rect
                        x={0}
                        y={0}
                        width={56}
                        height={14}
                        rx={7}
                        fill="#120e0b"
                        fillOpacity="0.92"
                        stroke={badgeBorder}
                        strokeWidth="0.9"
                      />
                      <text
                        x={28}
                        y={9.8}
                        textAnchor="middle"
                        fontSize="7.8"
                        fontWeight="700"
                        fill="#fef3c7"
                      >
                        {formatTroops(march.troops)} · {remainingSec}s
                      </text>
                    </g>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Live On-Map Siege Battle VFX */}
          {activeBattles.length > 0 && (
            <g className="pointer-events-none">
              {activeBattles.map((battle) => {
                const targetGeom = TAIWAN_MAP_GEOMETRIES[battle.targetId];
                if (!targetGeom) return null;

                const { labelX: bx, labelY: by } = targetGeom;
                const isConquered = battle.conquered;
                const attackerWon = battle.winner === 'attacker';

                const primaryRingColor = isConquered ? '#34d399' : '#f97316';
                const secondaryRingColor = isConquered ? '#fcd34d' : '#ef4444';
                const slashOuterColor = isConquered ? '#34d399' : '#ef4444';
                const badgeBg = isConquered
                  ? '#064e3b'
                  : attackerWon
                  ? '#7c2d12'
                  : '#1e293b';
                const badgeStroke = isConquered
                  ? '#fcd34d'
                  : attackerWon
                  ? '#fca5a5'
                  : '#93c5fd';
                const outcomeLabel = isConquered
                  ? '🏆 攻克！'
                  : attackerWon
                  ? '⚔️ 破敵！'
                  : '🛡️ 守住！';

                return (
                  <g key={battle.id} transform={`translate(${bx}, ${by})`}>
                    <g filter="url(#ember-glow)">
                      <circle
                        cx={0}
                        cy={0}
                        r={16}
                        fill="none"
                        stroke={primaryRingColor}
                        strokeWidth="3.5"
                        className="animate-battle-shockwave"
                      />
                      {isConquered && (
                        <circle
                          cx={0}
                          cy={0}
                          r={16}
                          fill="none"
                          stroke={secondaryRingColor}
                          strokeWidth="3"
                          className="animate-battle-shockwave-delayed"
                        />
                      )}
                    </g>

                    {CANNON_SMOKE_OFFSETS.map((sm, i) => (
                      <circle
                        key={`smoke-${i}`}
                        cx={sm.x}
                        cy={sm.y}
                        r={sm.r}
                        fill="#cbd5e1"
                        fillOpacity="0.45"
                        className="animate-cannon-smoke"
                        style={{ animationDelay: `${sm.delay}s` }}
                      />
                    ))}

                    <g filter="url(#ember-glow)">
                      <g className="animate-sword-slash-a">
                        <path
                          d="M -22 -3 Q 0 -11 22 -2 Q 0 -4 -22 -3 Z"
                          fill="#fef9c3"
                          stroke={slashOuterColor}
                          strokeWidth="1.2"
                        />
                      </g>
                      <g className="animate-sword-slash-b">
                        <path
                          d="M -22 3 Q 0 11 22 2 Q 0 4 -22 3 Z"
                          fill="#fef9c3"
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                        />
                      </g>
                    </g>

                    {BATTLE_SPARK_VECTORS.map((sp, i) => (
                      <g
                        key={`spark-${i}`}
                        className="animate-battle-spark"
                        style={
                          {
                            '--dx': `${sp.dx}px`,
                            '--dy': `${sp.dy}px`,
                            animationDelay: `${sp.delay}s`,
                          } as React.CSSProperties
                        }
                      >
                        <polygon
                          points="0,-4 2.2,0 0,4 -2.2,0"
                          fill={sp.gold ? '#fde047' : isConquered ? '#34d399' : '#fb7185'}
                        />
                      </g>
                    ))}

                    <circle cx={0} cy={0} r={5.5} fill="#fef9c3" fillOpacity="0.88" filter="url(#ember-glow)" />

                    <g className="animate-battle-callout" transform="translate(0, -18)">
                      <rect
                        x={-48}
                        y={-22}
                        width={96}
                        height={30}
                        rx={7}
                        fill={badgeBg}
                        fillOpacity="0.95"
                        stroke={badgeStroke}
                        strokeWidth="1.4"
                      />
                      <text
                        x={0}
                        y={-9.5}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="800"
                        fill="#fef08a"
                      >
                        {outcomeLabel}
                      </text>
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="700"
                        fill="#fecaca"
                      >
                        ⚔️ -{Math.floor(battle.defenderLoss)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}
          {/* Active 1949 Historical Event Scroll Badges (Clickable Directly on Map) */}
          {activeEvents.length > 0 && (
            <g>
              {activeEvents.map((ev, idx) => {
                const geom = TAIWAN_MAP_GEOMETRIES[ev.locationId];
                if (!geom) return null;
                // Place right next to the district landmark while staying inside the viewBox
                const bx = Math.min(vbW - 44, Math.max(44, geom.labelX + 34));
                const by = Math.min(vbH - 28, Math.max(28, geom.labelY - 22 - (idx % 2) * 10));

                return (
                  <g
                    key={`hist-event-${ev.id}`}
                    transform={`translate(${bx}, ${by})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStateRef.current.moved) {
                        dragStateRef.current.moved = false;
                        return;
                      }
                      onSelectEvent?.(ev.id);
                    }}
                    className="cursor-pointer"
                    role="button"
                    aria-label={`歷史事件：${ev.title}`}
                  >
                    <title>{`${ev.year}年${ev.month}月 · ${ev.title}`}</title>
                    {/* Expanding golden halo ring */}
                    <ellipse
                      cx={0}
                      cy={0}
                      rx={30}
                      ry={14}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      className="animate-event-ring pointer-events-none"
                    />
                    {/* Glowing pulsing scroll pill */}
                    <g className="animate-event-badge" filter="url(#ember-glow)">
                      <rect
                        x={-30}
                        y={-12}
                        width={60}
                        height={24}
                        rx={12}
                        fill="#451a03"
                        fillOpacity="0.96"
                        stroke="#fbbf24"
                        strokeWidth="1.8"
                      />
                      <rect
                        x={-27.5}
                        y={-9.5}
                        width={55}
                        height={19}
                        rx={9.5}
                        fill="none"
                        stroke="#fef08a"
                        strokeOpacity="0.6"
                        strokeWidth="0.8"
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="800"
                        letterSpacing="0.8"
                        fill="#fef08a"
                        fontFamily="'Noto Serif TC', 'Songti TC', 'PMingLiU', Georgia, serif"
                      >
                        📜 事件
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* Ornate Taiwanese Temple Mosaic (剪黏) Frame Corner Brackets */}
        <JiannianCornerBracket x={10} y={10} scaleX={1} scaleY={1} />
        <JiannianCornerBracket x={vbW - 10} y={10} scaleX={-1} scaleY={1} />
        <JiannianCornerBracket x={10} y={vbH - 10} scaleX={1} scaleY={-1} />
        <JiannianCornerBracket x={vbW - 10} y={vbH - 10} scaleX={-1} scaleY={-1} />

        {/* Temple Cartouche Title (Static Bottom-Left Overlay) */}
        <g transform="translate(20, 876)" className="pointer-events-none">
          <rect
            x={-10}
            y={-10}
            width={198}
            height={116}
            rx={14}
            fill="url(#lantern-cartouche-glow)"
          />
          <rect
            x={0}
            y={0}
            width={178}
            height={94}
            rx={6}
            fill="#14100d"
            fillOpacity="0.88"
            stroke="#d4a853"
            strokeWidth="1.35"
          />
          <rect
            x={4}
            y={4}
            width={170}
            height={86}
            rx={4}
            fill="none"
            stroke="#e2c992"
            strokeOpacity="0.34"
            strokeWidth="0.75"
          />
          <circle cx={8} cy={8} r={1.6} fill="#10b981" />
          <circle cx={170} cy={8} r={1.6} fill="#10b981" />
          <circle cx={8} cy={86} r={1.6} fill="#ef4444" />
          <circle cx={170} cy={86} r={1.6} fill="#ef4444" />

          <text
            x={16}
            y={29}
            fill="#fde68a"
            fontSize="14"
            fontWeight="800"
            letterSpacing="1.5"
          >
            臺海二十九區輿圖
          </text>
          <line
            x1={16}
            y1={39}
            x2={162}
            y2={39}
            stroke="#d4a853"
            strokeOpacity="0.45"
            strokeWidth="0.85"
          />
          <text x={16} y={56} fill="#e2c992" fontSize="9.5" letterSpacing="1">
            台灣群雄錄・百區爭霸
          </text>
          <text x={16} y={74} fill="#94a3b8" fontSize="8.5">
            滾輪縮放｜放大可拖曳
          </text>

          {/* Traditional Vermilion Red Seal Stamp */}
          <g transform="translate(140, 50)">
            <rect
              x={0}
              y={0}
              width={24}
              height={24}
              rx={2}
              fill="#991b1b"
              fillOpacity="0.92"
              stroke="#fca5a5"
              strokeWidth="0.9"
            />
            <text x={12} y={11} textAnchor="middle" fill="#fef2f2" fontSize="8.5" fontWeight="800">
              寶
            </text>
            <text x={12} y={21} textAnchor="middle" fill="#fef2f2" fontSize="8.5" fontWeight="800">
              島
            </text>
          </g>
        </g>

        {/* Decorative Compass Rose (Static Bottom-Right Overlay) */}
        <g transform={`translate(${vbW - 64}, ${vbH - 72})`} className="pointer-events-none" opacity="0.86">
          <circle
            cx={0}
            cy={0}
            r={28}
            fill="#14100d"
            fillOpacity="0.72"
            stroke="#d4a853"
            strokeWidth="1.15"
          />
          <circle
            cx={0}
            cy={0}
            r={22}
            fill="none"
            stroke="#e2c992"
            strokeOpacity="0.35"
            strokeWidth="0.7"
            strokeDasharray="2 2"
          />
          <polygon points="0,-20 4.5,-4 0,-7.5 -4.5,-4" fill="#fbbf24" />
          <polygon points="0,20 4.5,4 0,7.5 -4.5,4" fill="#94a3b8" />
          <polygon points="20,0 4,4.5 7.5,0 4,-4.5" fill="#94a3b8" />
          <polygon points="-20,0 -4,4.5 -7.5,0 -4,-4.5" fill="#94a3b8" />
          <circle cx={0} cy={0} r={3} fill="#dc2626" stroke="#fde68a" strokeWidth="0.75" />
          <text x={0} y={-23} textAnchor="middle" fill="#fde68a" fontSize="8.5" fontWeight="700">
            北
          </text>
          <text x={0} y={31} textAnchor="middle" fill="#cbd5e1" fontSize="8">
            南
          </text>
          <text x={29} y={3} textAnchor="middle" fill="#cbd5e1" fontSize="8">
            東
          </text>
          <text x={-29} y={3} textAnchor="middle" fill="#cbd5e1" fontSize="8">
            西
          </text>
        </g>
      </svg>

      {/* Top-Right Interactive Zoom & Pan Controls */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
        <div className="flex items-center gap-1 rounded-lg bg-[#16120e]/90 border border-amber-500/45 p-1 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleZoomBy(-0.25)}
            disabled={zoom <= MIN_ZOOM}
            title="縮小地圖"
            className="min-h-[38px] min-w-[38px] rounded-md bg-[#221a13] hover:bg-[#32251a] disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/35 text-amber-200 flex items-center justify-center transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="min-w-[44px] text-center text-[11px] font-mono font-bold text-amber-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoomBy(0.25)}
            disabled={zoom >= MAX_ZOOM}
            title="放大地圖"
            className="min-h-[38px] min-w-[38px] rounded-md bg-[#221a13] hover:bg-[#32251a] disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/35 text-amber-200 flex items-center justify-center transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="重置為 100% 置中"
            className="min-h-[38px] min-w-[38px] px-2.5 rounded-md bg-[#221a13] hover:bg-[#32251a] border border-amber-500/35 text-[11px] font-semibold text-amber-200 flex items-center justify-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置 100%</span>
          </button>
        </div>
        <div
          className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full border backdrop-blur-sm shadow ${
            isPannable
              ? 'bg-emerald-950/85 border-emerald-400/50 text-emerald-200'
              : 'bg-[#120e0b]/85 border-amber-500/30 text-amber-200/80'
          }`}
        >
          {isPannable ? '🖐 已放大 · 可拖曳移動地圖' : '🔒 100% 置中鎖定 · 放大可拖曳'}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredId && hoveredConfig && hoveredState && hoveredFaction && (
        <div
          className="pointer-events-none absolute z-20 w-60 rounded-xl bg-[#14100d]/95 border border-amber-500/55 p-3 shadow-2xl backdrop-blur-sm text-slate-100"
          style={{
            left: `${tooltipLeft}px`,
            top: `${tooltipTop}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-sm text-amber-200">
              {hoveredConfig.name}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border"
              style={{
                backgroundColor: `${hoveredFaction.color}33`,
                borderColor: hoveredFaction.borderColor,
                color: '#f8fafc',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: hoveredFaction.color }}
              />
              {hoveredFaction.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-300 border-t border-amber-500/20 pt-1.5">
            {hoveredLandmark && (
              <div className="col-span-2">
                <span className="text-slate-400">地標：</span>
                <span className="text-emerald-300 font-medium">{hoveredLandmark}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">地形：</span>
              {TERRAIN_LABELS[hoveredConfig.terrain]}
            </div>
            <div>
              <span className="text-slate-400">防禦：</span>
              +{hoveredConfig.baseDefense}%
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">特產：</span>
              <span className="text-amber-300">{hoveredConfig.specialtyName}</span>
            </div>
            <div>
              <span className="text-slate-400">駐軍：</span>
              <span className="font-semibold text-white">
                {Math.floor(hoveredState.troops).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">城牆：</span>
              Lv.{hoveredState.buildings.wall}
            </div>
          </div>

          {hasMatureCrop(hoveredState) && (
            <div className="mt-2 text-[11px] text-emerald-300 bg-emerald-950/75 border border-emerald-500/45 rounded-md px-2 py-1">
              🌱 農田作物已成熟，點擊立即收成！
            </div>
          )}

          {attackTargetSet.has(hoveredId) && (
            <div className="mt-1.5 text-[11px] text-rose-300 bg-rose-950/75 border border-rose-500/45 rounded-md px-2 py-1">
              ⚔️ 可出兵攻打此相鄰敵區
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaiwanMap;
