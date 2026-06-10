const AGENT_BASE_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8100";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

export interface ClaimAnalysisRequest {
  patentNumber: string;
  patentTitle: string;
  claimsText: string;
  accusedProductDescription: string;
  technicalField: string;
}

export interface ClaimAnalysisResponse {
  claimInterpretation: {
    independentClaims: Array<{
      claimNumber: number;
      text: string;
      technicalFeatures: string[];
      interpretation: string;
    }>;
    dependentClaims: Array<{
      claimNumber: number;
      text: string;
      interpretation: string;
    }>;
  };
  infringementComparison: {
    featureComparisons: Array<{
      feature: string;
      claimElement: string;
      accusedElement: string;
      comparison: string;
      reasoning: string;
    }>;
    overallConclusion: string;
    literalInfringement: boolean;
    doctrineOfEquivalents: string;
  };
  confidence: number;
  reasoning: string;
}

export interface ValuationRequest {
  patentNumber: string;
  patentTitle: string;
  technicalField: string;
  remainingLife: number;
  claimScope: string;
  marketData?: string;
  comparableLicenses?: string;
}

export interface ValuationResponse {
  methods: {
    incomeApproach: { value: number; assumptions: string[]; calculation: string };
    marketApproach: { value: number; comparables: Array<{ name: string; value: number }>; adjustments: string };
    costApproach: { value: number; rdCost: number; adjustments: string };
    royaltyRate: { rate: number; basis: string; comparableRates: Array<{ source: string; rate: number }> };
  };
  recommendedRange: { low: number; high: number; recommended: number };
  currency: string;
  assumptions: string[];
  sensitivityAnalysis: Array<{ variable: string; impact: number }>;
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      if (response.status >= 500) {
        lastError = new Error(`Server error: ${response.status}`);
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error("Failed to fetch after retries");
}

export async function analyzeClaims(req: ClaimAnalysisRequest): Promise<ClaimAnalysisResponse> {
  const response = await fetchWithRetry(`${AGENT_BASE_URL}/api/analyze-claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return response.json();
}

export async function valuatePatent(req: ValuationRequest): Promise<ValuationResponse> {
  const response = await fetchWithRetry(`${AGENT_BASE_URL}/api/valuate-patent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return response.json();
}

export async function checkAgentHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}
