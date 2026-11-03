/** Integer pixel reductions and a whole-pixel enlargement, without filtering. */
export const WORLD_ZOOM_LEVELS = [.25, .5, 1, 2] as const;
export function closestWorldZoom(value: number): number {
  return WORLD_ZOOM_LEVELS.reduce<number>((best, level) => Math.abs(level-value)<Math.abs(best-value)?level:best,1);
}
export function nextWorldZoom(current: number, direction: number): number {
  const levels: readonly number[] = WORLD_ZOOM_LEVELS;
  const index = levels.indexOf(closestWorldZoom(current));
  return levels[Math.max(0,Math.min(levels.length-1,index+Math.sign(direction)))];
}

/** Screen-pixel velocity while a held drawing reaches the visible map edge. */
export function planningEdgePan(x: number, y: number, top: number): {x: number; y: number} {
  if (x < 0 || x >= 640 || y <= top || y >= 310) return {x:0,y:0};
  const edge = (value: number, min: number, max: number) => value < min+28 ? -Math.min(1,(min+28-value)/28)
    : value > max-28 ? Math.min(1,(value-(max-28))/28) : 0;
  return {x:edge(x,0,640)*220,y:edge(y,top,310)*220};
}
