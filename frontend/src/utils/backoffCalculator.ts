/**
 * Calculates the exponential backoff delay in milliseconds based on the retry attempt number.
 * Capped by the maximum backoff limit.
 * 
 * Formula: min(initialBackoff * 2^retryCount, maxBackoff)
 */
export const calculateBackoff = (
  retryCount: number,
  initialBackoff = 2000,
  maxBackoff = 60000
): number => {
  if (retryCount <= 0) return 0;
  const backoff = initialBackoff * Math.pow(2, retryCount);
  return Math.min(backoff, maxBackoff);
};
