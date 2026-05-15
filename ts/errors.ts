/** Error code used for APIs intentionally left for a later implementation phase. */
export const ACADRUST_NOT_IMPLEMENTED = "ACADRUST_NOT_IMPLEMENTED" as const;
/** Error code used when DXF/DWG reading fails. */
export const ACADRUST_READ_ERROR = "ACADRUST_READ_ERROR" as const;
/** Error code used when DXF/DWG writing fails. */
export const ACADRUST_WRITE_ERROR = "ACADRUST_WRITE_ERROR" as const;

/** Stable error codes emitted by this package. */
export type AcadrustJsErrorCode =
  | typeof ACADRUST_NOT_IMPLEMENTED
  | typeof ACADRUST_READ_ERROR
  | typeof ACADRUST_WRITE_ERROR;

/** Base error class thrown by the TypeScript package boundary. */
export class AcadrustJsError extends Error {
  readonly code: AcadrustJsErrorCode;
  override readonly cause?: unknown;

  constructor(code: AcadrustJsErrorCode, message: string, options?: { readonly cause?: unknown }) {
    super(message);
    this.name = "AcadrustJsError";
    this.code = code;
    this.cause = options?.cause;
  }
}

/** Error for methods that are declared for API continuity but not implemented yet. */
export class AcadrustJsNotImplementedError extends AcadrustJsError {
  override readonly code = ACADRUST_NOT_IMPLEMENTED;

  constructor(feature: string) {
    super(
      ACADRUST_NOT_IMPLEMENTED,
      `${feature} is not implemented yet. Native bindings will be added in a later phase.`,
    );
    this.name = "AcadrustJsNotImplementedError";
  }
}
