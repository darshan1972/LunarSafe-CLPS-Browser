export function computeGridCellPixels(cellMeters: number, gsdMetersPerPixel: number): number {
  return Math.floor(cellMeters / gsdMetersPerPixel);
}

export class InstrumentResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstrumentResolutionError';
  }
}

export function assertCanDetectBoulders(gsdMetersPerPixel: number): void {
  if (gsdMetersPerPixel > 1.0) {
    throw new InstrumentResolutionError(
      `GSD of ${gsdMetersPerPixel} m/px is too coarse to detect 30cm boulders. ` +
      `Minimum required GSD for boulder detection is 1.0 m/px.`
    );
  }
}
