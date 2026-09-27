export type Language = 'si' | 'en';

export interface NicheItem {
  id: string;
  titleEn: string;
  titleSi: string;
  taglineEn: string;
  taglineSi: string;
  category: 'local_utilities' | 'micro_saas' | 'calculators' | 'student_education' | 'marketplaces';
  categoryLabelEn: string;
  categoryLabelSi: string;
  searchVolumeMonthly: string;
  searchVolumeSi: string;
  searchQueries: string[];
  competitionLevel: 'Very Low' | 'Low' | 'Moderate';
  competitionLevelSi: 'ඉතා අඩුයි' | 'අඩුයි' | 'මධ්‍යස්ථ';
  revenuePotential: string;
  revenuePotentialSi: string;
  monetizationModelEn: string;
  monetizationModelSi: string;
  buildTimeframe: string;
  buildTimeframeSi: string;
  problemSummaryEn: string;
  problemSummarySi: string;
  whyCompetitorsFailEn: string;
  whyCompetitorsFailSi: string;
  mvpFeaturesEn: string[];
  mvpFeaturesSi: string[];
  growthStrategyEn: string;
  growthStrategySi: string;
  techStack: string;
  hasInteractiveDemo?: boolean;
  demoToolId?: string;
}

export interface NicheAnalysisResult {
  ideaName: string;
  marketVerdict: string;
  opportunityScore: number;
  targetAudience: string;
  realSearchQueries: string[];
  whyExistingSolutionsFail: string;
  mvpFeatures: string[];
  monetizationModel: string;
  potentialEarnings: string;
  first1000UsersPlaybook: string;
  buildDifficulty: string;
  recommendedTechStack: string;
}
