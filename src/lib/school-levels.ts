/** Catalogue de niveaux/séries pré-enregistrables (système francophone). */

export const COLLEGE_LEVELS = ["6è", "5è", "4è", "3è"] as const;

export const LYCEE_LEVELS = ["2nde", "1ère", "Tle"] as const;

/** Séries du second cycle. */
export const SERIES = ["A1", "A2", "C", "D", "E", "F2", "G1", "G2"] as const;

export type LevelGroup = {
  /** Identifiant unique du groupe (niveau ou niveau+série). */
  key: string;
  /** Niveau enregistré dans `classes.level`. */
  level: string;
  /** Série éventuelle. */
  serie: string | null;
};

export const LEVEL_GROUPS: LevelGroup[] = [
  ...COLLEGE_LEVELS.map((level) => ({ key: level, level, serie: null })),
  ...LYCEE_LEVELS.flatMap((level) =>
    SERIES.map((serie) => ({ key: `${level} ${serie}`, level, serie })),
  ),
];

/** Noms générés pour un groupe : « 6è1 … 6è5 » ou « 2nde A1-1 … ». */
export function classNamesFor(group: LevelGroup, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    group.serie ? `${group.level} ${group.serie}-${i + 1}` : `${group.level}${i + 1}`,
  );
}
