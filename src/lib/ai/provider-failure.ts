/** Classify failures that invalidate a provider credential for the current routing attempt. */
export function isProviderWideFailure(httpStatus?: number): boolean {
  // Authentication/permission failures invalidate provider access. Quota, model and server
  // failures can be model-specific, so sibling models must still be attempted.
  return httpStatus === 401 || httpStatus === 403;
}
