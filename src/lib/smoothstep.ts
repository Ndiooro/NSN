export function smoothstep(
  edge0: number,
  edge1: number,
  value: number,
): number {
  const normalized = Math.min(
    1,
    Math.max(0, (value - edge0) / (edge1 - edge0)),
  );
  return normalized * normalized * (3 - 2 * normalized);
}
