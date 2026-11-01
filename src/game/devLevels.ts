// Two stand-in levels used only until src/model/levels.ts exists.
import type { LevelDef } from '../model/types.ts';

export const DEV_LEVELS: LevelDef[] = [
  { id: 1, world: 1, titleHe: 'מגדל צעיר', conceptHe: 'ילודה גבוהה: בסיס רחב', introHe: ['שולה מביאה הרבה תינוקות!', 'הכניסו אותם לרצפת התינוקות ומשכו במנוף.'], startYear: 1970, decades: 3, goal: 'reach', peoplePerBlock: 200000, wind: 0.15, hints: true,
    towers: [{ nameHe: 'ארץ צעירה', start: [0, 7, 5, 4, 3, 2, 1, 1], decades: [{ cbr: 45, cdr: 9, stage: 2 }, { cbr: 45, cdr: 9, stage: 2 }, { cbr: 44, cdr: 8, stage: 2 }], silhouette: [0.3, 0.22, 0.16, 0.11, 0.08, 0.06, 0.04, 0.03] }] },
  { id: 2, world: 2, titleHe: 'מגדל מזדקן', conceptHe: 'בסיס צר וראש כבד', introHe: ['מעט תינוקות והרבה קשישים.', 'קורות ירחיבו את הבסיס.'], startYear: 2000, decades: 3, goal: 'reach', peoplePerBlock: 2000000, wind: 0.15, hints: true,
    towers: [{ nameHe: 'ארץ ותיקה', start: [0, 3, 4, 5, 6, 6, 6, 6], decades: [{ cbr: 7, cdr: 13, stage: 4 }, { cbr: 7, cdr: 13, stage: 4 }, { cbr: 6, cdr: 14, stage: 4 }], silhouette: [0.07, 0.08, 0.1, 0.11, 0.14, 0.14, 0.15, 0.21] }] },
];
