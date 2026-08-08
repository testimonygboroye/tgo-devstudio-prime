export function validateTextLength(
  value: string | undefined,
  fieldLabel: string,
  maxLength: number
): string | null {
  if (value && value.length > maxLength) {
    return `${fieldLabel} must be ${maxLength} characters or fewer (currently ${value.length}).`;
  }
  return null;
}
