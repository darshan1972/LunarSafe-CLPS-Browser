export type LunarInstrument = 'OHRC' | 'TMC-2' | 'LROC-NAC' | 'LOLA' | 'UNKNOWN';

export interface LunarImageMetadata {
  gsdMetersPerPixel: number;
  instrument: LunarInstrument;
  sunAzimuthDeg: number;
  sunElevationDeg: number;
  targetSite: string;
  sourceProductUrn: string;
}
