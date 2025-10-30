export interface AnalysisResult {
  condition: string;
  calculation: string;
  actualResult: number | string;
  expectedValue: number | string;
  status: boolean;
  reason?: string;
}

export interface SavedSession {
  id: string;
  name: string;
  timestamp: string;
  results: AnalysisResult[];
  imageDataUrl?: string;
}
