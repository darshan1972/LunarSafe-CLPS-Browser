import { LunarImageMetadata, LunarInstrument } from './metadata';

export const INSTRUMENT_DEFAULT_GSD: Record<Exclude<LunarInstrument, 'UNKNOWN'>, number> = {
  'OHRC': 0.25,
  'TMC-2': 5.0,
  'LROC-NAC': 0.5,
  'LOLA': 5.0,
};

export class Pds4MetadataParseError extends Error {
  constructor(message: string) {
    super(`[PDS4 Label Parse Error] ${message}`);
    this.name = 'Pds4MetadataParseError';
  }
}

/**
 * Parses PDS4 XML product labels to extract authentic lunar image metadata & GSD.
 */
export function parsePds4XmlMetadata(xmlContent: string): LunarImageMetadata {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Pds4MetadataParseError('XML content is empty or invalid string.');
  }

  // Helper to extract text inside a tag
  const extractTag = (tagName: string): string | null => {
    const regex = new RegExp(`<(?:\w+:)?${tagName}[^>]*>([^<]+)<\/(?:\w+:)?${tagName}>`, 'i');
    const match = xmlContent.match(regex);
    return match ? match[1].trim() : null;
  };

  // 1. Identify Product URN / Logical Identifier
  const urn = extractTag('logical_identifier') || extractTag('lid_reference') || extractTag('Product_Observational');
  const sourceProductUrn = urn || 'urn:nasa:pds:unknown:product';

  // 2. Identify Target Site / Name
  const targetSite = extractTag('target_name') || extractTag('target') || 'Moon';

  // 3. Identify Instrument
  const instrumentText = (
    extractTag('instrument_name') ||
    extractTag('observing_system_component_name') ||
    extractTag('instrument_id') ||
    extractTag('instrument') ||
    extractTag('title') ||
    ''
  ).toUpperCase();

  let instrument: LunarInstrument = 'UNKNOWN';
  if (instrumentText.includes('OHRC') || xmlContent.includes('OHRC') || xmlContent.includes('ORBITER HIGH RESOLUTION CAMERA')) {
    instrument = 'OHRC';
  } else if (instrumentText.includes('TMC-2') || instrumentText.includes('TMC2') || xmlContent.includes('TMC-2') || xmlContent.includes('TERRAIN MAPPING CAMERA-2')) {
    instrument = 'TMC-2';
  } else if (instrumentText.includes('LROC') || instrumentText.includes('NAC') || xmlContent.includes('LROC_NAC') || xmlContent.includes('NARROW ANGLE CAMERA')) {
    instrument = 'LROC-NAC';
  } else if (instrumentText.includes('LOLA') || xmlContent.includes('LUNAR ORBITER LASER ALTIMETER')) {
    instrument = 'LOLA';
  }

  // 4. Extract Solar Angles
  const sunAzimuthStr = extractTag('solar_azimuth_angle') || extractTag('sun_azimuth') || extractTag('azimuth');
  const sunElevationStr = extractTag('solar_elevation_angle') || extractTag('sun_elevation') || extractTag('incidence_angle');

  const sunAzimuthDeg = sunAzimuthStr ? parseFloat(sunAzimuthStr) : 45.0;
  let sunElevationDeg = sunElevationStr ? parseFloat(sunElevationStr) : 45.0;
  // Convert solar incidence to elevation if incidence is specified (elevation = 90 - incidence)
  if (extractTag('incidence_angle') && !extractTag('solar_elevation_angle')) {
    sunElevationDeg = 90.0 - sunElevationDeg;
  }

  // 5. Extract or resolve GSD (Ground Sample Distance in meters per pixel)
  let gsdMetersPerPixel: number | null = null;

  const gsdTag = (
    extractTag('pixel_resolution') ||
    extractTag('ground_sample_distance') ||
    extractTag('spatial_resolution') ||
    extractTag('resolution') ||
    extractTag('horizontal_sampling')
  );

  if (gsdTag) {
    const parsedGsd = parseFloat(gsdTag);
    if (!isNaN(parsedGsd) && parsedGsd > 0) {
      gsdMetersPerPixel = parsedGsd;
    }
  }

  // Fallback to recognized instrument default if tag is omitted
  if (gsdMetersPerPixel === null && instrument !== 'UNKNOWN') {
    gsdMetersPerPixel = INSTRUMENT_DEFAULT_GSD[instrument];
  }

  // If GSD still cannot be determined, throw clear error naming the missing field
  if (gsdMetersPerPixel === null) {
    throw new Pds4MetadataParseError(
      'Missing required field: "pixel_resolution" / "ground_sample_distance" could not be extracted from PDS4 XML label, and instrument is UNKNOWN.'
    );
  }

  return {
    gsdMetersPerPixel,
    instrument,
    sunAzimuthDeg: isNaN(sunAzimuthDeg) ? 45.0 : sunAzimuthDeg,
    sunElevationDeg: isNaN(sunElevationDeg) ? 45.0 : sunElevationDeg,
    targetSite,
    sourceProductUrn,
  };
}
