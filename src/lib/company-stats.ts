/**
 * Statistiques clés de présence internationale de Nicomatic.
 */
export const COMPANY_STATS = {
  employees: 800,
  subsidiaries: 25,
  countries: 22,
} as const;

export type CompanyStats = typeof COMPANY_STATS;
