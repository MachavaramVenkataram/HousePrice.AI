export interface PropertyFeatures {
  GrLivArea: number;
  TotalBsmtSF: number;
  "1stFlrSF": number;
  "2ndFlrSF": number;
  YearBuilt: number;
  YearRemodAdd: number;
  OverallQual: number;
  OverallCond: number;
  FullBath: number;
  HalfBath: number;
  BsmtFullBath: number;
  BedroomAbvGr: number;
  TotRmsAbvGrd: number;
  Fireplaces: number;
  GarageCars: number;
  GarageArea: number;
  LotArea: number;
  LotFrontage: number;
  WoodDeckSF: number;
  OpenPorchSF: number;
  MoSold: number;
  YrSold: number;
  Neighborhood: string;
  BldgType: string;
  HouseStyle: string;
  MSZoning: string;
  KitchenQual: string;
  BsmtQual: string;
  HeatingQC: string;
  CentralAir: string;
  GarageType: string;
  SaleCondition: string;
}

export interface ModelInfo {
  name: string;
  version: string;
}

export function normalizeModelInfo(
  model: unknown,
  defaultName: string = "Regression Model",
  defaultVersion: string = "v1.0.0"
): ModelInfo {
  if (typeof model === "string") {
    return { name: model, version: defaultVersion };
  }
  if (model && typeof model === "object" && "name" in model) {
    const m = model as { name?: unknown; version?: unknown };
    return {
      name: m.name ? String(m.name) : defaultName,
      version: m.version ? String(m.version) : defaultVersion,
    };
  }
  return { name: defaultName, version: defaultVersion };
}

export function getModelDisplay(
  model: unknown,
  fallback: string = "Regression Model",
  includeVersion: boolean = false
): string {
  if (typeof model === "string") {
    return model;
  }
  if (model && typeof model === "object" && "name" in model) {
    const m = model as { name?: unknown; version?: unknown };
    const name = m.name ? String(m.name) : fallback;
    if (includeVersion && m.version) {
      return `${name} (${m.version})`;
    }
    return name;
  }
  return fallback;
}

export interface UncertaintyInfo {
  method: string;
  interval_width: number;
  uncertainty_level?: "Lower" | "Moderate" | "Higher";
  target_coverage?: number;
  observed_coverage?: number;
  mean_interval_width?: number;
  calibration_dataset?: string;
  calibration_samples?: number;
}

export interface PredictionInterval {
  lower: number;
  upper: number;
  coverage: number;
  lower_bound?: number;
  upper_bound?: number;
  margin?: number;
  interval_width?: number;
  confidence_level?: number;
  coverage_guarantee?: string;
  method?: string;
  uncertainty_level?: "Lower" | "Moderate" | "Higher";
  explanation?: string;
  calibration_samples?: number;
  target_coverage?: number;
  observed_coverage?: number;
  mean_interval_width?: number;
}

export interface FeatureContribution {
  feature: string;
  impact: number;
  absolute_impact: number;
  direction: "positive" | "negative";
  label: string;
  contribution_tier?: string;
  raw_value?: any;
}

export interface ExplanationSummary {
  method: string;
  features: FeatureContribution[];
  interpretation_notice: string;
}

export interface PredictionResponse {
  prediction: number;
  predicted_price: number;
  model: string | ModelInfo;
  model_version?: string;
  prediction_interval?: PredictionInterval | null;
  uncertainty?: UncertaintyInfo | null;
  explanation: ExplanationSummary;
  explanations: FeatureContribution[];
  metadata: {
    prediction_id?: number;
    model_version?: string;
    latency_ms: number;
    interval_available?: boolean;
    interval_unavailable_reason?: string;
    coverage_level_configured?: number;
    has_drift_warning: boolean;
    is_out_of_distribution?: boolean;
    ood_warning?: string;
    data_distribution_warning?: string;
    reliability_notice?: string;
    drift_warnings?: any[];
    messages?: string[];
    target_transform_applied: string;
    features_analyzed: number;
    dataset?: string;
    dataset_version?: string;
    dataset_source?: string;
    rows_trained?: number;
    rows_calibrated?: number;
    rows_evaluated?: number;
    features_count?: number;
    target_variable?: string;
    training_date?: string;
    validation_rmse?: number;
  };
  applicability?: ModelApplicabilityResponse | null;
  disclaimer: string;
}


export interface WhatIfResponse {
  original_price: number;
  new_price: number;
  difference: number;
  percentage_change: number;
  model: string | ModelInfo;
  original_interval?: PredictionInterval;
  new_interval?: PredictionInterval;
  top_diverging_factors: Array<{
    feature: string;
    from_value: any;
    to_value: any;
  }>;
  delta_statement?: string;
  statement?: string;
  disclaimer?: string;
}


export interface SensitivityPoint {
  feature_value: number;
  predicted_price: number;
}

export interface SensitivityResponse {
  target_feature: string;
  points: SensitivityPoint[];
  model: string | ModelInfo;
}

export interface BenchmarkItem {
  model: string;
  category: string;
  cv_rmse_mean: number;
  cv_rmse_std: number;
  cv_mae_mean: number;
  cv_mae_std: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  test_rmse: number;
  test_mae: number;
  test_r2: number;
  test_mape: number;
  training_time_sec: number;
  inference_time_ms: number;
}

export interface ResidualDiagnostics {
  mean_residual: number;
  median_residual: number;
  std_residual: number;
  min_residual: number;
  max_residual: number;
  rmse: number;
  mae: number;
  median_absolute_error: number;
  pct_within_5_percent: number;
  pct_within_10_percent: number;
  pct_within_20_percent: number;
}

export interface ScatterPoint {
  actual: number;
  predicted: number;
  error: number;
  abs_error_pct: number;
  neighborhood: string;
  gr_liv_area: number;
}

export interface ErrorExplorerRecord {
  id: number;
  actual_price: number;
  predicted_price: number;
  residual: number;
  absolute_error: number;
  relative_error_pct: number;
  key_features: Record<string, any>;
}

export interface DatasetProfile {
  source: string;
  rows: number;
  total_columns: number;
  target: string;
  numeric_features_count: number;
  categorical_features_count: number;
  numeric_features: string[];
  categorical_features: string[];
  target_distribution: {
    count: number;
    mean: number;
    std: number;
    min: number;
    p25: number;
    median: number;
    p75: number;
    max: number;
    skewness: number;
    kurtosis: number;
    log_skewness: number;
  };
  missing_values: Record<string, { count: number; percentage: number }>;
  duplicates_count: number;
  data_quality_score: number;
  data_quality_methodology: string;
  unique_neighborhoods: string[];
}

export interface LocationSummary {
  neighborhood: string;
  count: number;
  mean_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  mean_liv_area: number;
}

export interface PredictionHistoryRecord {
  id: number;
  timestamp: string;
  model_name: string;
  model_version: string;
  inputs: Record<string, any>;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  latency_ms: number;
  feedback?: string | null;
  feedback_comment?: string | null;
}

export interface PropertyProfile {
  living_area_sqft: number;
  total_basement_sqft: number;
  bedrooms: number;
  full_bathrooms: number;
  half_bathrooms: number;
  year_built: number;
  year_remodeled: number;
  overall_quality: number;
  overall_condition: number;
  neighborhood: string;
  garage_cars: number;
  summary_text: string;
  feature_chips: string[];
}

export interface InputQualityAssessment {
  status: "Excellent" | "Good" | "Limited";
  score_label: string;
  is_out_of_distribution: boolean;
  warnings: string[];
  passed_checks: string[];
  recommendation?: string;
}

export interface ModelPredictionSummary {
  model_name: string;
  predicted_price: number;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface ModelConsensus {
  models: ModelPredictionSummary[];
  mean_estimate: number;
  median_estimate: number;
  min_estimate: number;
  max_estimate: number;
  spread_amount: number;
  spread_percentage: number;
  agreement_level: "High Agreement" | "Moderate Agreement" | "Model Disagreement";
  disagreement_warning?: string | null;
}

export interface ReliabilityDimension {
  dimension: string;
  status: "Available" | "Limited" | "Unavailable";
  detail: string;
}

export interface EstimateReliabilityAssessment {
  overall_reliability: "Strong" | "Moderate" | "Limited" | "Unavailable";
  summary: string;
  dimensions: ReliabilityDimension[];
  consensus?: ModelConsensus;
}

export interface SimilarPropertyComparable {
  id: number;
  record_id?: string;
  similarity_rank?: number;
  sale_price: number;
  gr_liv_area: number;
  bedrooms: number;
  full_bath: number;
  overall_qual: number;
  year_built: number;
  neighborhood: string;
  price_per_sqft: number;
  similarity_pct: number;
  distance: number;
  key_match_attributes?: string[];
  why_selected?: string;
  similarity_features?: Record<string, any>;
  dataset_source: string;
}

export interface ComparableInsights {
  comparables: SimilarPropertyComparable[];
  comparable_count: number;
  comparable_median_price: number;
  comparable_mean_price: number;
  comparable_min_price: number;
  comparable_max_price: number;
  user_implied_price_per_sqft: number;
  comparable_median_price_per_sqft: number;
  positioning_summary: string;
  historical_disclaimer: string;
}

export interface AffordabilityRequest {
  budget: number;
  estimated_price: number;
  down_payment: number;
  interest_rate_pct: number;
  loan_term_years: number;
  monthly_property_tax: number;
  monthly_home_insurance: number;
}

export interface AffordabilityCalculation {
  scenario_label?: string;
  budget: number;
  estimated_price: number;
  down_payment: number;
  down_payment_pct: number;
  loan_amount: number;
  interest_rate_pct: number;
  loan_term_years: number;
  monthly_principal_interest: number;
  monthly_taxes_insurance: number;
  total_monthly_payment: number;
  total_interest_paid: number;
  total_cost_of_loan: number;
  upfront_cash_needed: number;
  is_within_budget: boolean;
  budget_delta: number;
  status_label: string;
  disclaimer: string;
}

export interface ImprovementScenario {
  scenario_id: string;
  name: string;
  description: string;
  modified_features: PropertyFeatures;
  potential_estimate: number;
  potential_interval?: PredictionInterval;
  modeled_difference: number;
  top_driver: string;
  user_renovation_cost?: number | null;
  net_modeled_scenario_difference?: number | null;
}

export interface ImprovementSimulationResponse {
  current_estimate: number;
  scenarios: ImprovementScenario[];
  disclaimer: string;
}

export interface SavedScenario {
  id: number;
  name: string;
  description?: string | null;
  features: Record<string, any>;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  model_name: string;
  model_version: string;
  created_at: string;
}

export interface PropertyProfileItem {
  id: number;
  name: string;
  description?: string | null;
  features: Record<string, any>;
  estimated_price: number;
  lower_bound: number;
  upper_bound: number;
  model_name: string;
  model_version: string;
  created_at: string;
  updated_at?: string | null;
}

export interface PropertyProfileComparisonItem {
  profile_id: number;
  name: string;
  estimated_price: number;
  lower_bound: number;
  upper_bound: number;
  living_area: number;
  bedrooms: number;
  full_bath: number;
  overall_qual: number;
  year_built: number;
  neighborhood: string;
  price_per_sqft: number;
  top_contributors: string[];
}

export interface PropertyProfileComparisonResponse {
  profiles: PropertyProfileComparisonItem[];
  count: number;
}

// ==========================================
// FEATURE 1: TARGET PRICE EXPLORER
// ==========================================

export interface TunableFeatureInfo {
  label: string;
  unit: string;
  scale: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface TargetPriceObjectiveInfo {
  id: "closest_target" | "smallest_feature_changes" | "balanced";
  name: string;
  description: string;
}

export interface TargetPriceCapabilities {
  supported_features: Record<string, TunableFeatureInfo>;
  objectives: TargetPriceObjectiveInfo[];
  dataset_price_range: {
    min: number;
    max: number;
    median: number;
    mean: number;
  };
}

export interface FeatureConstraint {
  min_value?: number;
  max_value?: number;
  allowed_values?: any[];
}

export interface TargetPriceRequest {
  target_price: number;
  starting_features: PropertyFeatures;
  changeable_features?: string[];
  feature_constraints?: Record<string, FeatureConstraint>;
  objective?: "closest_target" | "smallest_feature_changes" | "balanced";
  max_scenarios?: number;
}

export interface ChangedFeatureItem {
  feature: string;
  feature_label: string;
  original_value: any;
  new_value: any;
  delta?: number | null;
  unit: string;
}

export interface TargetPriceScenario {
  id: string;
  name: string;
  features: PropertyFeatures;
  predicted_price: number;
  prediction_interval?: PredictionInterval | null;
  difference_from_target: number;
  absolute_difference: number;
  percentage_difference: number;
  changed_features: ChangedFeatureItem[];
  changed_count: number;
  model_name: string;
  model_version: string;
  objective_score: number;
  applicability_warnings: string[];
}

export interface TargetPriceResponse {
  target_amount: number;
  objective: string;
  objective_explanation: string;
  scenarios: TargetPriceScenario[];
  feasible_count: number;
  explanation?: string | null;
  disclaimer: string;
}

// ==========================================
// FEATURE 2: MODEL APPLICABILITY CHECKER
// ==========================================

export interface ApplicabilityCheck {
  name: string;
  status: "passed" | "warning" | "limited" | "unsupported" | "available" | "unavailable" | "compatible" | "potentially_mismatched";
  message: string;
  details?: Record<string, any> | null;
}

export interface DatasetScopeInfo {
  dataset_name: string;
  dataset_source: string;
  geographic_scope: string;
  historical_period: string;
  target_variable: string;
  market_warning: string;
  known_limitations: string[];
}

export interface ModelApplicabilityResponse {
  status: "passed" | "limited" | "warning" | "unsupported";
  overall_summary: string;
  checks: ApplicabilityCheck[];
  limitations: string[];
  scope: DatasetScopeInfo;
  actionable_guidance?: string | null;
}

// ==========================================
// FEATURE 3: MODEL RELEASE MANAGER
// ==========================================

export interface ReleaseValidationCriterion {
  criterion_name: string;
  description: string;
  status: "passed" | "failed" | "warning";
  threshold: string;
  observed_value: any;
  message: string;
}

export interface ModelCandidateSummary {
  name: string;
  version: string;
  stage: string;
  cv_metrics: Record<string, any>;
  test_metrics: Record<string, any>;
  artifact_path: string;
  parameters: Record<string, any>;
  description: string;
  registered_at: string;
  is_production: boolean;
  is_candidate: boolean;
}

export interface ModelValidationResult {
  candidate_name: string;
  candidate_version: string;
  is_promotable: boolean;
  summary: string;
  criteria: ReleaseValidationCriterion[];
  latency_ms: number;
  preprocessing_compatible: boolean;
  interval_coverage?: number | null;
  mean_interval_width?: number | null;
  evaluated_at: string;
}

export interface ModelComparisonMetricRow {
  metric: string;
  label: string;
  current_value: any;
  candidate_value: any;
  difference?: number | null;
  improvement?: boolean | null;
  unit: string;
}

export interface ModelComparisonResult {
  current_model: string;
  current_version: string;
  candidate_model: string;
  candidate_version: string;
  comparison_rows: ModelComparisonMetricRow[];
  overall_recommendation: string;
  better_model: string;
}

export interface PromotionRequest {
  candidate_name: string;
  approver?: string;
  notes?: string;
}

export interface CancelCandidateRequest {
  candidate_name: string;
  reason?: string;
}

export interface RollbackRequest {
  approver?: string;
  notes?: string;
}

export interface ModelReleaseHistoryItem {
  id: number;
  timestamp: string;
  model_name: string;
  model_version: string;
  action: string;
  previous_model?: string | null;
  previous_version?: string | null;
  approver: string;
  notes?: string | null;
  validation_metrics: Record<string, any>;
}

export interface ModelReleaseStatusResponse {
  current_production_model: ModelCandidateSummary;
  candidates: ModelCandidateSummary[];
  baseline_model?: ModelCandidateSummary | null;
  dataset_version: string;
  training_run_id?: string | null;
  promotion_criteria: string[];
  can_rollback: boolean;
  rollback_target?: string | null;
  recent_releases: ModelReleaseHistoryItem[];
}


