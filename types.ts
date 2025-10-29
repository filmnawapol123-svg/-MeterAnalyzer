
export interface AnalysisResult {
  condition: string;
  calculation: string;
  actualResult: number | string;
  expectedValue: number | string;
  status: boolean;
  reason?: string;
}
