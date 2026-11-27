import React, { useId, useState } from 'react';
import type {
  BuildingType,
  CropId,
  HeroConfig,
  Rarity,
  UnitType,
} from '../types/game';
import { HeroPortraitSvg, hasBespokeHeroPortrait } from './HeroPortraits';

interface CropIconProps {
  cropId: CropId;
  className?: string;
}

export const CropIcon: React.FC<CropIconProps> = ({
  cropId,
  className = 'w-6 h-6',
}) => {
  const uid = useId();

  switch (cropId) {
    case 'rice':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="稻米"
        >
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d99b26" />
            </linearGradient>
          </defs>
          {/* Stalks & leaves */}
          <path
            d="M15 28C15 20 17 13 23 6"
            stroke="#c99738"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 28C13 21 10 15 6 11"
            stroke="#49a888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 28C18 22 22 18 27 16"
            stroke="#2e8b6e"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Drooping golden rice grains */}
          <ellipse cx="22.5" cy="7.5" rx="2" ry="3.2" transform="rotate(28 22.5 7.5)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="19" cy="9.5" rx="2" ry="3.2" transform="rotate(-18 19 9.5)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="22" cy="12" rx="2" ry="3.2" transform="rotate(34 22 12)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="16.5" cy="13.5" rx="2" ry="3.2" transform="rotate(-22 16.5 13.5)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="19.5" cy="16" rx="1.9" ry="3" transform="rotate(28 19.5 16)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="14.5" cy="17.5" rx="1.9" ry="3" transform="rotate(-24 14.5 17.5)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
          <ellipse cx="11" cy="13" rx="1.7" ry="2.8" transform="rotate(-38 11 13)" fill={`url(#${uid}-g)`} stroke="#785826" strokeWidth="0.7" />
        </svg>
      );

    case 'tea':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="高山茶"
        >
          <defs>
            <linearGradient id={`${uid}-l1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#1f6f57" />
            </linearGradient>
            <linearGradient id={`${uid}-l2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#2e8b6e" />
            </linearGradient>
          </defs>
          {/* Main stem */}
          <path
            d="M16 28C16 22 16 17 16 11"
            stroke="#134739"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Left jade tea leaf */}
          <path
            d="M15.5 22C8.5 21.5 4.5 16.5 5 10.5C11 10 15.5 14 15.5 22Z"
            fill={`url(#${uid}-l1)`}
            stroke="#0d3128"
            strokeWidth="1"
          />
          <path d="M14.5 20.5L8.2 13.5" stroke="#d3eee3" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />
          {/* Right jade tea leaf */}
          <path
            d="M16.5 20C23.5 19.5 27.5 14.5 27 8.5C21 8 16.5 12 16.5 20Z"
            fill={`url(#${uid}-l2)`}
            stroke="#0d3128"
            strokeWidth="1"
          />
          <path d="M17.5 18.5L23.8 11.5" stroke="#eef8f4" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />
          {/* Top tender bud */}
          <path
            d="M16 13.5C13.5 10.5 14 6.5 16 4C18 6.5 18.5 10.5 16 13.5Z"
            fill="#d3eee3"
            stroke="#1f6f57"
            strokeWidth="1"
          />
          {/* Morning dew */}
          <circle cx="21.5" cy="13.5" r="1.1" fill="#fdfaf3" opacity="0.9" />
        </svg>
      );

    case 'pineapple':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="金鑽鳳梨"
        >
          <defs>
            <linearGradient id={`${uid}-p`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Crown leaves */}
          <path d="M16 12L12 4L15.5 7.5L16 3L17.5 7.5L21 4L17 12Z" fill="#2e8b6e" stroke="#0d3128" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M14 12.5L8.5 7.5L13 10.5Z" fill="#49a888" stroke="#0d3128" strokeWidth="0.7" />
          <path d="M18 12.5L23.5 7.5L19 10.5Z" fill="#49a888" stroke="#0d3128" strokeWidth="0.7" />
          {/* Golden body */}
          <rect x="9.5" y="11.5" width="13" height="16.5" rx="6.5" fill={`url(#${uid}-p)`} stroke="#785826" strokeWidth="1.1" />
          {/* Crosshatch pattern */}
          <path d="M11 15.5L20 24.5M14 12.5L22 20.5M10 20L16.5 26.5" stroke="#92400e" strokeWidth="0.9" opacity="0.65" />
          <path d="M21 15.5L12 24.5M18 12.5L10 20.5M22 20L15.5 26.5" stroke="#92400e" strokeWidth="0.9" opacity="0.65" />
          {/* Highlight */}
          <ellipse cx="13" cy="17" rx="1.3" ry="3" fill="#fef9c3" opacity="0.45" />
        </svg>
      );

    case 'mango':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="愛文芒果"
        >
          <defs>
            <linearGradient id={`${uid}-m`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e25c47" />
              <stop offset="48%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
          </defs>
          {/* Stem & leaf */}
          <path d="M18 6C17.5 4.5 16.5 3.5 15 3.5" stroke="#785826" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M17.5 6.5C21.5 4 25.5 5 26.5 8C23 9.5 19.5 9 17.5 6.5Z" fill="#2e8b6e" stroke="#0d3128" strokeWidth="0.9" />
          {/* Curved Taiwanese Irwin mango */}
          <path
            d="M17.5 7C12 7 7.5 12 7.5 18.2C7.5 23.8 11.2 28 16.2 28C20.4 28 24.5 25.2 24.2 19.8C23.9 14.8 22.8 7 17.5 7Z"
            fill={`url(#${uid}-m)`}
            stroke="#7c2d12"
            strokeWidth="1.1"
          />
          {/* Gloss */}
          <path
            d="M12.2 12.5C10.8 14.5 10.5 17.5 11.3 20"
            stroke="#fff7ed"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.65"
          />
        </svg>
      );

    case 'sugar_apple':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="台東釋迦"
        >
          <defs>
            <radialGradient id={`${uid}-sa`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="60%" stopColor="#49a888" />
              <stop offset="100%" stopColor="#1f6f57" />
            </radialGradient>
          </defs>
          {/* Stem */}
          <path d="M16 4V8.5" stroke="#785826" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 6.5C19 4.5 22 5.2 23 7.5C20 8.5 17.5 8 16 6.5Z" fill="#2e8b6e" stroke="#0d3128" strokeWidth="0.8" />
          {/* Base heart-rounded fruit */}
          <path
            d="M16 8C10.5 8 6.5 12.2 6.8 18C7.1 23.5 11.5 28 16 28C20.5 28 24.9 23.5 25.2 18C25.5 12.2 21.5 8 16 8Z"
            fill={`url(#${uid}-sa)`}
            stroke="#0d3128"
            strokeWidth="1.1"
          />
          {/* Iconic scaly custard-apple bumps */}
          <path d="M9.5 14C11 15.5 13 15.5 14.5 14M17.5 14C19 15.5 21 15.5 22.5 14" stroke="#eef8f4" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
          <path d="M8.5 19C10.2 20.6 12.3 20.6 14 19M14 18.5C15.5 20.2 16.5 20.2 18 18.5M18 19C19.7 20.6 21.8 20.6 23.5 19" stroke="#eef8f4" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
          <path d="M11 23.5C12.5 25 14.2 25 15.8 23.5M16.2 23.5C17.8 25 19.5 25 21 23.5" stroke="#eef8f4" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'sugarcane':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="白甘蔗"
        >
          <defs>
            <linearGradient id={`${uid}-sc`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bef264" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>
          </defs>
          {/* Sweeping leaves */}
          <path d="M12 10C7 7 4 9 3.5 12.5C6.5 11 9.5 11 12 12.5Z" fill="#49a888" stroke="#0d3128" strokeWidth="0.7" />
          <path d="M21 9C25 5.5 28 6.5 28.5 10C26 9 23.5 9.5 21 11.5Z" fill="#2e8b6e" stroke="#0d3128" strokeWidth="0.7" />
          {/* Two segmented bamboo-like sugarcane stalks */}
          <g transform="rotate(-12 13 17)">
            <rect x="10.5" y="5" width="4.4" height="23" rx="2" fill={`url(#${uid}-sc)`} stroke="#365314" strokeWidth="1" />
            <line x1="10.5" y1="11.5" x2="14.9" y2="11.5" stroke="#ecfccb" strokeWidth="1.3" />
            <line x1="10.5" y1="18" x2="14.9" y2="18" stroke="#ecfccb" strokeWidth="1.3" />
            <line x1="10.5" y1="24" x2="14.9" y2="24" stroke="#ecfccb" strokeWidth="1.3" />
          </g>
          <g transform="rotate(10 20 17)">
            <rect x="17.5" y="6" width="4.4" height="22" rx="2" fill="#d9f99d" stroke="#3f6212" strokeWidth="1" />
            <line x1="17.5" y1="12.5" x2="21.9" y2="12.5" stroke="#65a30d" strokeWidth="1.2" />
            <line x1="17.5" y1="19" x2="21.9" y2="19" stroke="#65a30d" strokeWidth="1.2" />
            <line x1="17.5" y1="24.5" x2="21.9" y2="24.5" stroke="#65a30d" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'sweet_potato':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="台農地瓜"
        >
          <defs>
            <linearGradient id={`${uid}-sp`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0566b" />
              <stop offset="55%" stopColor="#9f3548" />
              <stop offset="100%" stopColor="#6b2135" />
            </linearGradient>
          </defs>
          {/* Sprout */}
          <path d="M23.5 9.5C25.5 7 27.5 7.5 28 9.5C26 10.5 24.5 10.5 23.5 9.5Z" fill="#49a888" stroke="#0d3128" strokeWidth="0.7" />
          {/* Tapered sweet potato tuber */}
          <path
            d="M25.5 8.5C22 7.5 15.5 9.2 10.5 14C6.5 17.8 4.8 22.8 6.5 25.2C8.5 27.2 14.2 25.8 19.2 21.5C24.2 17.2 27.2 10.8 25.5 8.5Z"
            fill={`url(#${uid}-sp)`}
            stroke="#4c1d24"
            strokeWidth="1.1"
          />
          {/* Golden inner cut / highlight accent */}
          <ellipse cx="14.5" cy="18.2" rx="3.8" ry="2.2" transform="rotate(-38 14.5 18.2)" fill="#fbbf24" opacity="0.88" stroke="#d97706" strokeWidth="0.7" />
          <circle cx="20" cy="13" r="0.8" fill="#f8d4dc" opacity="0.7" />
          <circle cx="10.2" cy="22.4" r="0.7" fill="#f8d4dc" opacity="0.7" />
        </svg>
      );

    case 'peanut':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="北港花生"
        >
          <defs>
            <linearGradient id={`${uid}-pn`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3d9a4" />
              <stop offset="100%" stopColor="#c49147" />
            </linearGradient>
          </defs>
          {/* Classic figure-8 peanut shell */}
          <path
            d="M22.2 6.8C19.5 5.2 16.2 6.8 15 9.6C14.2 11.4 13.2 12.4 11.5 13.4C8.4 15.2 6.2 18.6 7.8 22.2C9.4 25.6 13.6 26.6 16.8 24.4C19.2 22.8 19.8 20.5 20.6 18.5C21.2 17 22.4 15.8 23.8 14.4C26 12.2 25.2 8.6 22.2 6.8Z"
            fill={`url(#${uid}-pn)`}
            stroke="#785826"
            strokeWidth="1.2"
          />
          {/* Shell reticulated ridges */}
          <path
            d="M17.2 9.2L22.5 12.5M14.2 12.8L19.8 16.2M10.5 16.5L17.4 20.8M9.5 20.5L14.5 23.6"
            stroke="#8a622a"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M21 8.5L11.5 22.5"
            stroke="#fef3c7"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );
  }
};

interface BuildingIconProps {
  type: BuildingType;
  className?: string;
}

export const BuildingIcon: React.FC<BuildingIconProps> = ({
  type,
  className = 'w-6 h-6',
}) => {
  const uid = useId();

  switch (type) {
    case 'granary':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="糧倉"
        >
          <defs>
            <linearGradient id={`${uid}-roof`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e25c47" />
              <stop offset="100%" stopColor="#8c2619" />
            </linearGradient>
          </defs>
          {/* Traditional curved Taiwanese eaves */}
          <path
            d="M3.5 13.5C8.5 11.5 12.5 8 16 4.5C19.5 8 23.5 11.5 28.5 13.5L26 15.5H6L3.5 13.5Z"
            fill={`url(#${uid}-roof)`}
            stroke="#3f2e14"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          {/* Timber granary body */}
          <rect x="7" y="15.5" width="18" height="11.5" rx="1" fill="#e2c992" stroke="#5c421d" strokeWidth="1.1" />
          {/* Wooden beams */}
          <line x1="7" y1="19.5" x2="25" y2="19.5" stroke="#9f752e" strokeWidth="1" />
          <rect x="13" y="20.5" width="6" height="6.5" rx="0.8" fill="#785826" />
          {/* Golden grain emblem on gable */}
          <circle cx="16" cy="11.5" r="2" fill="#f5c969" stroke="#5c421d" strokeWidth="0.7" />
          {/* Stone plinth */}
          <rect x="5.5" y="27" width="21" height="2.2" rx="0.8" fill="#64748b" />
        </svg>
      );

    case 'barracks':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="兵營"
        >
          {/* Vermilion war banner */}
          <path d="M16 4V12" stroke="#d1ac65" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16.5 4.5H23.5L21.5 7.2L23.5 9.8H16.5V4.5Z" fill="#c83e2b" stroke="#6e1e14" strokeWidth="0.8" />
          {/* Martial pavilion roof */}
          <path
            d="M4 15L16 9.5L28 15L26 17H6L4 15Z"
            fill="#334155"
            stroke="#d1ac65"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          {/* Barracks hall */}
          <rect x="6.5" y="17" width="19" height="10.5" fill="#1e293b" stroke="#b88d42" strokeWidth="1.1" />
          {/* Pillars */}
          <line x1="10.5" y1="17" x2="10.5" y2="27.5" stroke="#c83e2b" strokeWidth="1.6" />
          <line x1="21.5" y1="17" x2="21.5" y2="27.5" stroke="#c83e2b" strokeWidth="1.6" />
          {/* Crossed blades emblem */}
          <path d="M13 24.5L19 19.5M19 24.5L13 19.5" stroke="#f5c969" strokeWidth="1.5" strokeLinecap="round" />
          {/* Base */}
          <rect x="5" y="27.5" width="22" height="2" rx="0.6" fill="#94a3b8" />
        </svg>
      );

    case 'wall':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="城牆"
        >
          {/* Fortress battlements */}
          <path
            d="M4 10H8V13H11.5V10H15.5V13H19.5V10H23.5V13H25.5V10H28V28H4V10Z"
            fill="#475569"
            stroke="#cbd5e1"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          {/* Masonry courses */}
          <line x1="4.5" y1="17" x2="27.5" y2="17" stroke="#94a3b8" strokeWidth="0.9" opacity="0.65" />
          <line x1="4.5" y1="22" x2="27.5" y2="22" stroke="#94a3b8" strokeWidth="0.9" opacity="0.65" />
          {/* Traditional arched city gate */}
          <path
            d="M12.5 28V22.2C12.5 20.1 14.1 18.5 16 18.5C17.9 18.5 19.5 20.1 19.5 22.2V28H12.5Z"
            fill="#1e1612"
            stroke="#d1ac65"
            strokeWidth="1.1"
          />
          {/* Gate plaque */}
          <rect x="13" y="13.8" width="6" height="2.4" rx="0.4" fill="#c83e2b" stroke="#f5c969" strokeWidth="0.6" />
        </svg>
      );

    case 'market':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="市集"
        >
          {/* Striped market awning */}
          <path
            d="M4.5 11.5L7 6.5H25L27.5 11.5C27.5 13.2 26 14.5 24.2 14.5C22.6 14.5 21.4 13.5 21 12.2C20.5 13.5 19.3 14.5 17.8 14.5C16.5 14.5 15.4 13.6 15 12.4C14.5 13.6 13.4 14.5 12 14.5C10.5 14.5 9.3 13.5 8.8 12.2C8.3 13.5 7.2 14.5 5.8 14.5C4.8 14.5 4.5 13.2 4.5 11.5Z"
            fill="#c83e2b"
            stroke="#5c1d14"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M11 6.5L9.5 13M16 6.5V13M21 6.5L22.5 13" stroke="#fdfaf3" strokeWidth="1.3" opacity="0.85" />
          {/* Wooden counter & posts */}
          <line x1="7.5" y1="14.5" x2="7.5" y2="27.5" stroke="#b88d42" strokeWidth="1.8" />
          <line x1="24.5" y1="14.5" x2="24.5" y2="27.5" stroke="#b88d42" strokeWidth="1.8" />
          <rect x="6" y="21.5" width="20" height="6" rx="0.8" fill="#d1ac65" stroke="#5c421d" strokeWidth="1" />
          {/* Hanging lantern & ancient square-hole coin */}
          <circle cx="16" cy="18.2" r="2.8" fill="#f5c969" stroke="#785826" strokeWidth="0.9" />
          <rect x="15" y="17.2" width="2" height="2" fill="#3f2e14" />
        </svg>
      );
  }
};

interface UnitTypeIconProps {
  unitType: UnitType;
  className?: string;
}

export const UnitTypeIcon: React.FC<UnitTypeIconProps> = ({
  unitType,
  className = 'w-5 h-5',
}) => {
  switch (unitType) {
    case 'infantry':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="步兵"
        >
          {/* Curved saber behind shield */}
          <path
            d="M23.5 5C25 8.5 23.5 13.5 19.5 17.5L9 26.5"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M7.5 23.5L11.5 27.5" stroke="#d1ac65" strokeWidth="2" strokeLinecap="round" />
          {/* Traditional round rattan/bronze shield */}
          <circle cx="15.5" cy="16.5" r="8.5" fill="#9f752e" stroke="#f5c969" strokeWidth="1.5" />
          <circle cx="15.5" cy="16.5" r="5.2" fill="#785826" stroke="#e2c992" strokeWidth="0.9" strokeDasharray="2 1.5" />
          <circle cx="15.5" cy="16.5" r="2" fill="#f5c969" />
        </svg>
      );

    case 'cavalry':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="騎兵"
        >
          {/* Pennant lance */}
          <path d="M24 4L14 27" stroke="#e2c992" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M23.5 5L29 7.5L22 10.5Z" fill="#c83e2b" />
          {/* Stylized warhorse head & mane */}
          <path
            d="M8 25.5C8.5 21 10.5 18 11.5 15.5L8.5 14.5C7 14 6.2 12.6 7 11.2L10.2 7.5L12 5L14 7.2C16.8 7.5 19.2 9.5 19.8 12.8C20.3 15.6 19.5 21 20.5 25.5H8Z"
            fill="#d1ac65"
            stroke="#3f2e14"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Eye & bridle */}
          <circle cx="12.2" cy="10.2" r="1" fill="#101924" />
          <path d="M16.5 9.2C18 11.5 18 15 17.2 18" stroke="#785826" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case 'archer':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="弓兵"
        >
          {/* Composite recurve bow */}
          <path
            d="M11 5.5C18.5 7 22.5 11.5 22.5 16C22.5 20.5 18.5 25 11 26.5"
            stroke="#d1ac65"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          {/* Bowstring */}
          <path d="M11 6L7.5 16L11 26" stroke="#e2c992" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {/* Nocked arrow */}
          <line x1="7.5" y1="16" x2="26.5" y2="16" stroke="#fdfaf3" strokeWidth="1.7" strokeLinecap="round" />
          {/* Arrowhead */}
          <path d="M23.5 13L28 16L23.5 19L24.8 16L23.5 13Z" fill="#f5c969" />
          {/* Vermilion fletching */}
          <path d="M6 13.5L9.5 16L6 18.5" stroke="#c83e2b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'naval':
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={className}
          aria-label="水師"
        >
          {/* Mast */}
          <line x1="15.5" y1="5" x2="15.5" y2="21.5" stroke="#d1ac65" strokeWidth="1.6" strokeLinecap="round" />
          {/* Traditional slatted Chinese/Taiwanese lugsail */}
          <path
            d="M16 6.5C21.5 7.5 24.5 12 24 18.5H16V6.5Z"
            fill="#f8f0dc"
            stroke="#785826"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <line x1="16" y1="10.5" x2="22.8" y2="10.5" stroke="#b88d42" strokeWidth="0.9" />
          <line x1="16" y1="14.5" x2="23.8" y2="14.5" stroke="#b88d42" strokeWidth="0.9" />
          {/* Fore jib */}
          <path d="M14.5 9L9 18H14.5V9Z" fill="#e2c992" stroke="#785826" strokeWidth="0.9" />
          {/* War junk hull */}
          <path
            d="M5.5 20.5H26.5L23.5 24.8H8.5L5.5 20.5Z"
            fill="#8c4a27"
            stroke="#d1ac65"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          {/* Ink-wash sea waves */}
          <path
            d="M4 27C6.5 25.5 8.5 25.5 11 27C13.5 28.5 15.5 28.5 18 27C20.5 25.5 22.5 25.5 25 27C26.5 27.8 27.5 27.8 28.5 27"
            stroke="#49a888"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
}

const RARITY_STYLES: Record<
  Rarity,
  {
    wrapper: string;
    inner: string;
    label: string;
  }
> = {
  SSR: {
    wrapper:
      'bg-gradient-to-br from-[#c83e2b] via-[#9e2518] to-[#6e160d] border-[#f5c969] text-[#fef3c7] shadow-[0_0_10px_rgba(245,201,105,0.45)]',
    inner: 'border-[#f5c969]/60',
    label: 'SSR',
  },
  SR: {
    wrapper:
      'bg-gradient-to-br from-[#1f6f57] via-[#2c4a66] to-[#4c3480] border-[#7dd3bc] text-[#eef8f4] shadow-[0_0_8px_rgba(73,168,136,0.35)]',
    inner: 'border-[#a7f3d0]/45',
    label: 'SR',
  },
  R: {
    wrapper:
      'bg-gradient-to-br from-[#475569] via-[#334155] to-[#1e293b] border-[#b8976a] text-[#efe0bc] shadow-sm',
    inner: 'border-[#d1ac65]/35',
    label: 'R',
  },
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  className = '',
}) => {
  const style = RARITY_STYLES[rarity];
  return (
    <span
      className={`relative inline-flex items-center justify-center px-1.5 py-0.5 rounded-[3px] border font-serif font-black tracking-[0.12em] text-[10px] leading-none select-none ${style.wrapper} ${className}`}
    >
      <span
        className={`pointer-events-none absolute inset-[1.5px] rounded-[2px] border ${style.inner}`}
      />
      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
        {style.label}
      </span>
    </span>
  );
};

interface HeroAvatarProps {
  hero: HeroConfig;
  className?: string;
}

const RARITY_RIM: Record<Rarity, string> = {
  SSR: 'border-[#f7cd6d] shadow-[0_0_14px_rgba(247,205,109,0.42),0_0_6px_rgba(200,62,43,0.28)]',
  SR: 'border-[#64c4a8] shadow-[0_0_12px_rgba(73,168,136,0.32)]',
  R: 'border-[#a48056] shadow-[0_2px_8px_rgba(0,0,0,0.45)]',
};

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  hero,
  className = 'w-14 h-14',
}) => {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(hero.portraitUrl) && !imgError;
  const showBespokeSvg = !showImage && hasBespokeHeroPortrait(hero.id);
  const surname = hero.name.trim().slice(0, 1) || '雄';

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border-[1.5px] bg-[#140d0b] shrink-0 select-none ${RARITY_RIM[hero.rarity]} ${className}`}
      title={`${hero.name} · ${hero.title}`}
    >
      {showImage ? (
        <>
          <img
            src={hero.portraitUrl}
            alt={hero.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          {/* Ornate temple-gold inner vignette for painted SSR portraits */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow:
                'inset 0 0 14px rgba(18, 8, 5, 0.72), inset 0 0 4px rgba(247, 205, 109, 0.36)',
            }}
          />
          {/* Subtle corner Jiannian gold accents */}
          <span className="pointer-events-none absolute top-0.5 left-0.5 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-[#f7cd6d]/85 rounded-tl-[2px]" />
          <span className="pointer-events-none absolute top-0.5 right-0.5 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-[#f7cd6d]/85 rounded-tr-[2px]" />
          <span className="pointer-events-none absolute bottom-0.5 left-0.5 w-2 h-2 border-b-[1.5px] border-l-[1.5px] border-[#f7cd6d]/85 rounded-bl-[2px]" />
          <span className="pointer-events-none absolute bottom-0.5 right-0.5 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-[#f7cd6d]/85 rounded-br-[2px]" />
        </>
      ) : showBespokeSvg ? (
        <>
          <HeroPortraitSvg
            heroId={hero.id}
            className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 10px rgba(10, 6, 5, 0.45)',
            }}
          />
        </>
      ) : (
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 30% 22%, ${hero.themeColor}cc 0%, ${hero.themeColor}55 48%, #0c141f 100%)`,
          }}
        >
          {/* Traditional Taiwanese lattice / cloud watermark */}
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="24" stroke="#f5c969" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M8 14H14V8M56 14H50V8M8 50H14V56M56 50H50V56" stroke="#f5c969" strokeWidth="1.5" />
          </svg>

          {/* Carved Chinese surname seal */}
          <div className="relative z-10 flex items-center justify-center w-[62%] h-[62%] rounded-md border border-parchment-300/65 bg-indigoInk-950/60 shadow-[inset_0_0_8px_rgba(245,201,105,0.2)]">
            <span className="font-serif font-black text-parchment-100 text-[1.15em] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
              {surname}
            </span>
          </div>

          {/* Corner unit type crest */}
          <div className="absolute bottom-0.5 right-0.5 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-indigoInk-950/90 border border-parchment-400/70 p-0.5 shadow">
            <UnitTypeIcon unitType={hero.unitType} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Subtle gold inner rim */}
      <div className="pointer-events-none absolute inset-[2px] rounded-[6px] border border-parchment-200/20" />
    </div>
  );
};
