import { ACADRUST_READ_ERROR, ACADRUST_WRITE_ERROR, AcadrustJsError } from "./errors.js";

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function asReadError(error: unknown, operation: string): AcadrustJsError {
  return new AcadrustJsError(ACADRUST_READ_ERROR, `${operation} failed: ${errorDetail(error)}`, {
    cause: error,
  });
}

export function asWriteError(error: unknown, operation: string): AcadrustJsError {
  return new AcadrustJsError(ACADRUST_WRITE_ERROR, `${operation} failed: ${errorDetail(error)}`, {
    cause: error,
  });
}
