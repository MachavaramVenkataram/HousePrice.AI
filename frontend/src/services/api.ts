import {
  PropertyFeatures,
  PredictionResponse,
  WhatIfResponse,
  SensitivityResponse,
  BenchmarkItem,
  ResidualDiagnostics,
  ScatterPoint,
  ErrorExplorerRecord,
  DatasetProfile,
  LocationSummary,
  PredictionHistoryRecord,
  PropertyProfile,
  InputQualityAssessment,
  EstimateReliabilityAssessment,
  ComparableInsights,
  AffordabilityRequest,
  AffordabilityCalculation,
  ImprovementSimulationResponse,
  SavedScenario,
  PropertyProfileItem,
  PropertyProfileComparisonResponse,
  TargetPriceCapabilities,
  TargetPriceRequest,
  TargetPriceResponse,
  ModelApplicabilityResponse,
  DatasetScopeInfo,
  ModelReleaseStatusResponse,
  ModelComparisonResult,
  ModelValidationResult,
  PromotionRequest,
  CancelCandidateRequest,
  RollbackRequest,
} from "../types";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Predictions
  predict: (
    features: PropertyFeatures,
    modelOverride?: string,
    coverageLevel?: number
  ): Promise<PredictionResponse> =>
    fetchJson<PredictionResponse>("/predict", {
      method: "POST",
      body: JSON.stringify({
        features,
        model_override: modelOverride,
        coverage_level: coverageLevel,
      }),
    }),

  whatIf: (baseFeatures: PropertyFeatures, modifiedFeatures: PropertyFeatures, modelOverride?: string): Promise<WhatIfResponse> =>
    fetchJson<WhatIfResponse>("/predict/what-if", {
      method: "POST",
      body: JSON.stringify({
        base_features: baseFeatures,
        modified_features: modifiedFeatures,
        model_override: modelOverride,
      }),
    }),

  sensitivity: (baseFeatures: PropertyFeatures, targetFeature: string = "GrLivArea", steps: number = 15): Promise<SensitivityResponse> =>
    fetchJson<SensitivityResponse>("/predict/sensitivity", {
      method: "POST",
      body: JSON.stringify({
        base_features: baseFeatures,
        target_feature: targetFeature,
        steps,
      }),
    }),

  submitFeedback: (predictionId: number, feedback: "accurate" | "inaccurate", comment?: string) =>
    fetchJson<{ status: string; message: string }>("/predict/feedback", {
      method: "POST",
      body: JSON.stringify({ prediction_id: predictionId, feedback, comment }),
    }),

  getHistory: (limit: number = 25): Promise<PredictionHistoryRecord[]> =>
    fetchJson<PredictionHistoryRecord[]>(`/predict/history?limit=${limit}`),

  // Models & Benchmarks
  getRegistry: () => fetchJson<any>("/models"),
  getBenchmark: (): Promise<BenchmarkItem[]> => fetchJson<BenchmarkItem[]>("/models/benchmark"),
  getResiduals: (): Promise<ResidualDiagnostics> => fetchJson<ResidualDiagnostics>("/models/residuals"),
  getErrors: (): Promise<ErrorExplorerRecord[]> => fetchJson<ErrorExplorerRecord[]>("/models/errors"),
  getGlobalShap: (): Promise<Array<{ feature: string; importance: number }>> =>
    fetchJson<Array<{ feature: string; importance: number }>>("/models/shap/global"),
  getScatter: (): Promise<ScatterPoint[]> => fetchJson<ScatterPoint[]>("/models/scatter"),
  getOptuna: () => fetchJson<{ best_params: Record<string, any>; best_cv_rmse: number; trial_history: any[] }>("/models/optuna"),

  // Dataset & Locations
  getDatasetProfile: (): Promise<DatasetProfile> => fetchJson<DatasetProfile>("/dataset/profile"),
  getDatasetRows: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    neighborhood?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    sortBy?: string;
    sortDesc?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", params.page.toString());
    if (params.pageSize) q.set("page_size", params.pageSize.toString());
    if (params.search) q.set("search", params.search);
    if (params.neighborhood) q.set("neighborhood", params.neighborhood);
    if (params.minPrice) q.set("min_price", params.minPrice.toString());
    if (params.maxPrice) q.set("max_price", params.maxPrice.toString());
    if (params.minBedrooms) q.set("min_bedrooms", params.minBedrooms.toString());
    if (params.sortBy) q.set("sort_by", params.sortBy);
    if (params.sortDesc !== undefined) q.set("sort_desc", params.sortDesc.toString());
    return fetchJson<any>(`/dataset/rows?${q.toString()}`);
  },
  getLocationAnalytics: (): Promise<LocationSummary[]> => fetchJson<LocationSummary[]>("/dataset/locations"),

  // Monitoring
  getMonitoringMetrics: () => fetchJson<any>("/monitoring/metrics"),
  runDriftTest: () => fetchJson<any>("/monitoring/drift", { method: "POST" }),

  // Health
  checkHealth: () => fetchJson<any>("/health"),

  // Download PDF
  downloadPdfUrl: () => `${getApiBase()}/reports/pdf`,

  // Decision Intelligence
  getPropertyProfile: (features: PropertyFeatures): Promise<{ profile: PropertyProfile; input_quality: InputQualityAssessment }> =>
    fetchJson<{ profile: PropertyProfile; input_quality: InputQualityAssessment }>("/decision/profile", {
      method: "POST",
      body: JSON.stringify(features),
    }),

  getSimilarProperties: (
    features: PropertyFeatures,
    estimatedPrice: number,
    priority: string = "balanced",
    topK: number = 5,
    matchScope: string = "balanced"
  ): Promise<ComparableInsights> => {
    const q = new URLSearchParams({
      estimated_price: estimatedPrice.toString(),
      priority,
      top_k: topK.toString(),
      match_scope: matchScope,
    });
    return fetchJson<ComparableInsights>(`/decision/similar?${q.toString()}`, {
      method: "POST",
      body: JSON.stringify(features),
    });
  },

  getEstimateReliability: (
    features: PropertyFeatures,
    intervalWidth?: number,
    estimatedPrice?: number
  ): Promise<EstimateReliabilityAssessment> => {
    const q = new URLSearchParams();
    if (intervalWidth) q.set("interval_width", intervalWidth.toString());
    if (estimatedPrice) q.set("estimated_price", estimatedPrice.toString());
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<EstimateReliabilityAssessment>(`/decision/reliability${queryStr}`, {
      method: "POST",
      body: JSON.stringify(features),
    });
  },

  calculateAffordability: (req: AffordabilityRequest): Promise<AffordabilityCalculation> =>
    fetchJson<AffordabilityCalculation>("/decision/affordability", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  compareBudgets: (scenarios: AffordabilityRequest[]): Promise<AffordabilityCalculation[]> =>
    fetchJson<AffordabilityCalculation[]>("/decision/affordability/compare", {
      method: "POST",
      body: JSON.stringify(scenarios),
    }),

  simulateImprovements: (
    features: PropertyFeatures,
    renovationCosts?: Record<string, number>
  ): Promise<ImprovementSimulationResponse> =>
    fetchJson<ImprovementSimulationResponse>("/decision/improve", {
      method: "POST",
      body: JSON.stringify({ features, renovation_costs: renovationCosts }),
    }),

  saveScenario: (scenario: {
    name: string;
    description?: string;
    features: PropertyFeatures;
    predicted_price: number;
    lower_bound: number;
    upper_bound: number;
    model_name?: string;
    model_version?: string;
  }): Promise<SavedScenario> =>
    fetchJson<SavedScenario>("/decision/scenarios", {
      method: "POST",
      body: JSON.stringify(scenario),
    }),

  updateScenario: (
    scenarioId: number,
    data: {
      name?: string;
      description?: string;
      features?: PropertyFeatures;
      predicted_price?: number;
      lower_bound?: number;
      upper_bound?: number;
      model_name?: string;
      model_version?: string;
    }
  ): Promise<SavedScenario> =>
    fetchJson<SavedScenario>(`/decision/scenarios/${scenarioId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  duplicateScenario: (scenarioId: number): Promise<SavedScenario> =>
    fetchJson<SavedScenario>(`/decision/scenarios/${scenarioId}/duplicate`, {
      method: "POST",
    }),

  getSavedScenarios: (): Promise<SavedScenario[]> =>
    fetchJson<SavedScenario[]>("/decision/scenarios"),

  deleteScenario: (scenarioId: number): Promise<{ status: string; message: string }> =>
    fetchJson<{ status: string; message: string }>(`/decision/scenarios/${scenarioId}`, {
      method: "DELETE",
    }),

  // Property Profiles
  saveProfile: (profile: {
    name: string;
    description?: string;
    features: PropertyFeatures;
    estimated_price: number;
    lower_bound: number;
    upper_bound: number;
    model_name?: string;
    model_version?: string;
  }): Promise<PropertyProfileItem> =>
    fetchJson<PropertyProfileItem>("/decision/profiles", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  getProfiles: (limit: number = 20): Promise<PropertyProfileItem[]> =>
    fetchJson<PropertyProfileItem[]>(`/decision/profiles?limit=${limit}`),

  deleteProfile: (profileId: number): Promise<{ status: string; message: string }> =>
    fetchJson<{ status: string; message: string }>(`/decision/profiles/${profileId}`, {
      method: "DELETE",
    }),

  compareProfiles: (profileIds: number[]): Promise<PropertyProfileComparisonResponse> =>
    fetchJson<PropertyProfileComparisonResponse>("/decision/profiles/compare", {
      method: "POST",
      body: JSON.stringify(profileIds),
    }),

  // Feature 1: Target Price Explorer
  getTargetPriceCapabilities: (): Promise<TargetPriceCapabilities> =>
    fetchJson<TargetPriceCapabilities>("/target-price/capabilities"),

  searchTargetPrice: (request: TargetPriceRequest): Promise<TargetPriceResponse> =>
    fetchJson<TargetPriceResponse>("/target-price/search", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  // Feature 2: Model Applicability Checker
  checkApplicability: (features: PropertyFeatures): Promise<ModelApplicabilityResponse> =>
    fetchJson<ModelApplicabilityResponse>("/applicability/check", {
      method: "POST",
      body: JSON.stringify(features),
    }),

  getDatasetScope: (): Promise<DatasetScopeInfo> =>
    fetchJson<DatasetScopeInfo>("/applicability/scope"),

  getSupportedCategories: (): Promise<Record<string, string[]>> =>
    fetchJson<Record<string, string[]>>("/applicability/supported-categories"),

  // Feature 3: Model Release Manager
  getReleaseStatus: (): Promise<ModelReleaseStatusResponse> =>
    fetchJson<ModelReleaseStatusResponse>("/models/releases/status"),

  compareReleaseModels: (candidateName: string, currentName?: string): Promise<ModelComparisonResult> => {
    const params = new URLSearchParams({ candidate_name: candidateName });
    if (currentName) params.append("current_name", currentName);
    return fetchJson<ModelComparisonResult>(`/models/releases/compare?${params.toString()}`);
  },

  validateReleaseCandidate: (candidateName: string): Promise<ModelValidationResult> => {
    const params = new URLSearchParams({ candidate_name: candidateName });
    return fetchJson<ModelValidationResult>(`/models/releases/validate?${params.toString()}`, {
      method: "POST",
    });
  },

  promoteModel: (request: PromotionRequest): Promise<ModelReleaseStatusResponse> =>
    fetchJson<ModelReleaseStatusResponse>("/models/releases/promote", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  cancelReleaseCandidate: (request: CancelCandidateRequest): Promise<ModelReleaseStatusResponse> =>
    fetchJson<ModelReleaseStatusResponse>("/models/releases/cancel", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  rollbackModel: (request: RollbackRequest): Promise<ModelReleaseStatusResponse> =>
    fetchJson<ModelReleaseStatusResponse>("/models/releases/rollback", {
      method: "POST",
      body: JSON.stringify(request),
    }),
};
