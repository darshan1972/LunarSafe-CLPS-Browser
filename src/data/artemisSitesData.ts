/**
 * Approximate, illustrative base slope values; not computed by the Horn pipeline.
 * The rigorous Horn pipeline runs on the 4 benchmark DEM tiles.
 */

export interface ArtemisSite {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  clps_mission: string;
  primary_target: string;
  lighting_pct?: number;
  base_slope_deg: number;
  roughness_index: number;
  description: string;
  earth_comm?: boolean;
}

export function computeLunarSafeScore(slope: number, tolerance: number): number {
  if (slope <= tolerance) {
    const margin = tolerance - slope;
    return Math.round(65 + Math.min(33, (margin / tolerance) * 33 + 5));
  } else {
    const excess = slope - tolerance;
    return Math.round(Math.max(12, 50 - (excess / tolerance) * 60));
  }
}

export const ARTEMIS_III_SITES: ArtemisSite[] = [
  {
    id: 'A3-01',
    name: 'Faustini Rim A',
    code: 'FAUSTINI_A',
    latitude: -87.16,
    longitude: 77.00,
    elevation_m: -240,
    clps_mission: 'CLPS PRISM / Polar Explorer',
    primary_target: 'PSR volatile trap along Faustini crater rim',
    lighting_pct: 74.5,
    base_slope_deg: 6.8,
    roughness_index: 0.28,
    description: 'High-altitude rim crest bordering permanently shadowed region (PSR). Offers favorable direct-to-Earth communications and extended solar illumination periods.',
    earth_comm: true,
  },
  {
    id: 'A3-02',
    name: 'Peak Near Shackleton',
    code: 'SHACKLETON_PEAK',
    latitude: -89.54,
    longitude: 129.78,
    elevation_m: 1120,
    clps_mission: 'CLPS IM-2 (PRIME-1 Ice Drill)',
    primary_target: 'Quasi-continuous solar illumination summit',
    lighting_pct: 89.2,
    base_slope_deg: 8.4,
    roughness_index: 0.42,
    description: 'Topographic peak 0.46 degrees from the true Lunar South Pole. Prime location for polar solar arrays with access to the floor of Shackleton crater.',
    earth_comm: true,
  },
  {
    id: 'A3-03',
    name: 'Connecting Ridge',
    code: 'CONNECTING_RIDGE',
    latitude: -89.44,
    longitude: -137.10,
    elevation_m: 840,
    clps_mission: 'CLPS Nova-C / Lunar Trailblazer Relay',
    primary_target: 'High ground connecting Shackleton to de Gerlache',
    lighting_pct: 82.0,
    base_slope_deg: 5.2,
    roughness_index: 0.22,
    description: 'Narrow elevated ridge linking Shackleton crater to the de Gerlache rim. Exceptionally low local slopes suitable for commercial landing pads.',
    earth_comm: true,
  },
  {
    id: 'A3-04',
    name: 'Connecting Ridge Extension',
    code: 'CONN_RIDGE_EXT',
    latitude: -89.17,
    longitude: -155.60,
    elevation_m: 610,
    clps_mission: 'CLPS Masten / Astrobotic Lander',
    primary_target: 'Gentle rolling highland plain',
    lighting_pct: 78.4,
    base_slope_deg: 7.1,
    roughness_index: 0.31,
    description: 'Northwest continuation of the Connecting Ridge feature. Broad terrain facilitating multi-lander surface infrastructure deployment.',
    earth_comm: true,
  },
  {
    id: 'A3-05',
    name: 'de Gerlache Rim 1',
    code: 'DE_GERLACHE_1',
    latitude: -88.71,
    longitude: -88.40,
    elevation_m: 430,
    clps_mission: 'CLPS Firefly Blue Ghost 2',
    primary_target: 'Stratified impact melt and regolith breccia',
    lighting_pct: 84.1,
    base_slope_deg: 9.6,
    roughness_index: 0.38,
    description: 'Prominent eastern crest of de Gerlache crater. Direct line-of-sight to Earth combined with proximity to deep hydrogen deposits inside the crater floor.',
    earth_comm: true,
  },
  {
    id: 'A3-06',
    name: 'de Gerlache Rim 2',
    code: 'DE_GERLACHE_2',
    latitude: -88.34,
    longitude: -68.50,
    elevation_m: 290,
    clps_mission: 'CLPS Draper / ispace APEX 1.0',
    primary_target: 'Far-side highland contact boundary',
    lighting_pct: 76.3,
    base_slope_deg: 11.2,
    roughness_index: 0.45,
    description: 'Secondary shoulder along de Gerlache rim. Moderate slopes requiring real-time hazard avoidance during final powered descent phase.',
    earth_comm: false,
  },
  {
    id: 'A3-07',
    name: 'de Gerlache-Kocher Massif',
    code: 'KOCHER_MASSIF',
    latitude: -85.84,
    longitude: -114.50,
    elevation_m: 1420,
    clps_mission: 'CLPS Long-Duration Polar Science',
    primary_target: 'Pre-Nectarian crustal uplift block',
    lighting_pct: 86.8,
    base_slope_deg: 13.8,
    roughness_index: 0.58,
    description: 'Massive elevated plateau standing over 1.4 km above adjacent floor. Offers long-duration solar exposure but steeper localized flank slopes.',
    earth_comm: true,
  },
  {
    id: 'A3-08',
    name: 'Haworth',
    code: 'HAWORTH_CREST',
    latitude: -87.87,
    longitude: -5.10,
    elevation_m: 180,
    clps_mission: 'CLPS Micro-Nova Hopper',
    primary_target: 'Deep cold trap rim with surface frost signatures',
    lighting_pct: 71.0,
    base_slope_deg: 6.3,
    roughness_index: 0.25,
    description: 'Smooth saddle region perched above Haworth crater interior, identified by LRO LAMP and Mini-RF as harboring surficial water-ice signatures.',
    earth_comm: false,
  },
  {
    id: 'A3-09',
    name: 'Malapert Mountain',
    code: 'MALAPERT_MTN',
    latitude: -85.99,
    longitude: 2.90,
    elevation_m: 2240,
    clps_mission: 'CLPS Intuitive Machines IM-1 (Odysseus)',
    primary_target: 'Peak of Eternal Light candidate / Telecoms Relay',
    lighting_pct: 91.5,
    base_slope_deg: 4.9,
    roughness_index: 0.19,
    description: 'Historic landing site candidate for Intuitive Machines IM-1. Malapert Mountain stands over 5 km high with flat crest summits receiving over 90% annual illumination.',
    earth_comm: true,
  },
  {
    id: 'A3-10',
    name: 'Leibnitz Beta Plateau',
    code: 'LEIBNITZ_BETA',
    latitude: -85.83,
    longitude: 28.60,
    elevation_m: 1890,
    clps_mission: 'CLPS Commercial Cargo Transport',
    primary_target: 'South Pole-Aitken Basin deep excavation strata',
    lighting_pct: 85.0,
    base_slope_deg: 5.8,
    roughness_index: 0.24,
    description: 'Extensive elevated plateau on the South Pole-Aitken basin margin. Flat, smooth landing areas with clear line of sight to Earth stations.',
    earth_comm: true,
  },
  {
    id: 'A3-11',
    name: 'Nobile Rim 1',
    code: 'NOBILE_RIM_1',
    latitude: -85.25,
    longitude: 53.50,
    elevation_m: 720,
    clps_mission: 'CLPS Astrobotic Griffin (VIPER Target)',
    primary_target: 'Volatile-bearing terrain within rover driving range',
    lighting_pct: 81.3,
    base_slope_deg: 6.1,
    roughness_index: 0.26,
    description: 'Selected landing region for the Astrobotic Griffin lander and NASA VIPER rover mission. Characterized by wide, gently undulating terrain with shallow impact craters.',
    earth_comm: true,
  },
  {
    id: 'A3-12',
    name: 'Nobile Rim 2',
    code: 'NOBILE_RIM_2',
    latitude: -85.38,
    longitude: 36.60,
    elevation_m: 650,
    clps_mission: 'CLPS Secondary Target Site',
    primary_target: 'Nobile western rim bench',
    lighting_pct: 79.7,
    base_slope_deg: 8.1,
    roughness_index: 0.33,
    description: 'Western terrace flanking Nobile crater. Good mobility access corridor across multiple permanently shadowed cold traps.',
    earth_comm: true,
  },
  {
    id: 'A3-13',
    name: 'Amundsen Rim',
    code: 'AMUNDSEN_RIM',
    latitude: -84.50,
    longitude: 85.60,
    elevation_m: 580,
    clps_mission: 'CLPS Commercial Science Lander',
    primary_target: 'Anorthositic central peak and rim terrace',
    lighting_pct: 77.2,
    base_slope_deg: 7.4,
    roughness_index: 0.30,
    description: 'Northernmost candidate region offering direct communications with Earth ground antennas and smooth terrace steps for safe touchdown.',
    earth_comm: true,
  },
];
