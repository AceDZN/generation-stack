// Where the campaign comes from. Swapped to src/model/levels.ts once the authored levels land.
import type { LevelDef } from '../model/types.ts';
import { DEV_LEVELS } from './devLevels.ts';

export const LEVELS: LevelDef[] = DEV_LEVELS;
export const endlessLevel: ((seed: number) => LevelDef) | null = null;
