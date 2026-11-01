// Where the campaign comes from. The endless tower joins once src/model/endless.ts lands.
import type { LevelDef } from '../model/types.ts';
export { LEVELS } from '../model/levels.ts';

export const endlessLevel: ((seed: number) => LevelDef) | null = null;
