export interface ValidationIssue {
  code: string;
  message: string;
  partId?: string;
  constraints?: { min?: number; max?: number; requested?: number };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  metadata: {
    partCount: number;
    boundingBoxMm?: { width: number; height: number; depth: number };
    checkedAt: string;
    [key: string]: unknown;
  };
}
