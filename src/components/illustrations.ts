// Drawings copied verbatim from design/svg (src/design-copies.test.ts keeps them identical).
import monster1Tamed from '../assets/illustrations/canavar-1-evcil.svg';
import monster1Wild from '../assets/illustrations/canavar-1-vahsi.svg';
import monster2Tamed from '../assets/illustrations/canavar-2-evcil.svg';
import monster2Wild from '../assets/illustrations/canavar-2-vahsi.svg';
import tile1 from '../assets/illustrations/cini-1.svg';
import tile2 from '../assets/illustrations/cini-2.svg';
import tile3 from '../assets/illustrations/cini-3.svg';
import tile4 from '../assets/illustrations/cini-4.svg';
import tile5 from '../assets/illustrations/cini-5.svg';
import tile6 from '../assets/illustrations/cini-6.svg';
import tileLocked from '../assets/illustrations/cini-kilitli.svg';
import companionHappy from '../assets/illustrations/tikir-happy.svg';
import companionListen from '../assets/illustrations/tikir-listen.svg';
import companionNormal from '../assets/illustrations/tikir-normal.svg';
import companionSleep from '../assets/illustrations/tikir-sleep.svg';
import companionTalk from '../assets/illustrations/tikir-talk.svg';
import companionThink from '../assets/illustrations/tikir-think.svg';

export type CompanionExpression = 'normal' | 'listen' | 'talk' | 'happy' | 'sleep' | 'think';

export const companionImages: Readonly<Record<CompanionExpression, string>> = {
  normal: companionNormal,
  listen: companionListen,
  talk: companionTalk,
  happy: companionHappy,
  sleep: companionSleep,
  think: companionThink,
};

export type MonsterKind = 1 | 2;
export type MonsterState = 'wild' | 'tamed';

export const monsterImages: Readonly<Record<MonsterKind, Record<MonsterState, string>>> = {
  1: { wild: monster1Wild, tamed: monster1Tamed },
  2: { wild: monster2Wild, tamed: monster2Tamed },
};

export type TilePattern = 1 | 2 | 3 | 4 | 5 | 6;

export const tilePatternImages: Readonly<Record<TilePattern, string>> = {
  1: tile1,
  2: tile2,
  3: tile3,
  4: tile4,
  5: tile5,
  6: tile6,
};

export const lockedTileImage = tileLocked;
