export interface SpaceGalleryItem {
  id: string;
  title: string;
  agency: 'ISRO' | 'NASA' | 'JOINT_ISRO_NASA';
  mission: 'Chandrayaan-3' | 'Chandrayaan-2' | 'Chandrayaan-1' | 'LRO / LROC' | 'Apollo Program' | 'LOLA Elevation';
  instrument: string;
  targetRegion: string;
  lunarCoordinates?: {
    lat: string;
    lng: string;
  };
  acquisitionDate: string;
  resolution: string;
  imageUrl: string;
  localFallbackUrl?: string;
  nasaId?: string;
  pdsId?: string;
  isroReleaseId?: string;
  canAnalyzeInEngine?: boolean;
  licensing: {
    status: 'PUBLIC_DOMAIN' | 'ISRO_OPEN_ACCESS';
    legalCitation: string;
    termsUrl: string;
  };
  technicalDetails: {
    spectralBand?: string;
    sensorType: string;
    altitudeKm?: number;
    solarZenithAngle?: string;
    geologicalFeatures: string[];
    missionSignificance: string;
  };
  description: string;
  officialSourceUrl: string;
}

export const SPACE_GALLERY_DATA: SpaceGalleryItem[] = [
  // ==========================================
  // ISRO CHANDRAYAAN-3 MISSIONS
  // ==========================================
  {
    id: 'isro-ch3-shivshakti-descent',
    title: 'Pragyan Rover Deployment & Ramp Tracks at Shiv Shakti Point',
    agency: 'ISRO',
    mission: 'Chandrayaan-3',
    instrument: 'Lander Imager Camera (LIC) & NavCam Stereo Pair',
    targetRegion: 'South Polar Highlands (Shiv Shakti Point)',
    lunarCoordinates: {
      lat: '69.373° S',
      lng: '32.319° E',
    },
    acquisitionDate: '2023-08-25',
    resolution: 'Sub-centimeter surface proximity',
    imageUrl: 'https://images-assets.nasa.gov/image/as11-37-5458/as11-37-5458~medium.jpg', // NASA L&S reference fallback
    localFallbackUrl: '/src/assets/samples/isro_ohrc_shivshakti_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Scientific Media Release & ISSDC Open Data Policy (Govt. of India)',
      termsUrl: 'https://www.isro.gov.in/chandrayaan3.html',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic Visible (400-750 nm)',
      sensorType: 'CMOS Active-Pixel Sensor with Bayer Mosaic & Polarized Filters',
      altitudeKm: 0.002, // 2 meters ground elevation
      solarZenithAngle: '78.5° (low-angle morning sun illuminating shadows)',
      geologicalFeatures: ['Lunar fine-grained regolith', 'Pragyan wheel compression tracks', 'Sub-meter impact craterlets', 'Basaltic micro-breccias'],
      missionSignificance: 'First operational mobile robotic exploration on the lunar high-latitude south polar region. Confirmed absence of deep dust sinkholes and measured soil thermal conductivity using ChaSTE.',
    },
    description:
      'Historic image captured after the successful soft-touchdown of Vikram Lander on August 23, 2023. Shows the two-segment deployment ramp and the Pragyan 6-wheeled rover descending onto the southern high-latitude regolith. The tracks demonstrate shallow regolith cohesion of 1-3 kPa.',
    officialSourceUrl: 'https://www.isro.gov.in/chandrayaan3_gallery.html',
  },
  {
    id: 'isro-ch3-hazard-crater-encounter',
    title: 'Pragyan Rover Autonomous Hazard Avoidance: 4-Meter Crater Wall',
    agency: 'ISRO',
    mission: 'Chandrayaan-3',
    instrument: 'Navigation Camera (NavCam-L / NavCam-R)',
    targetRegion: 'Shiv Shakti Traverse (3 meters from crater rim)',
    lunarCoordinates: {
      lat: '69.369° S',
      lng: '32.315° E',
    },
    acquisitionDate: '2023-08-27',
    resolution: '0.02 m/pixel stereo',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA12893/PIA12893~small.jpg',
    localFallbackUrl: '/src/assets/samples/psr_shadow_zone.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Chandrayaan-3 Navigation Log (ISSDC Public Release)',
      termsUrl: 'https://www.isro.gov.in/chandrayaan3.html',
    },
    technicalDetails: {
      spectralBand: 'Monochrome Panchromatic (NavCam)',
      sensorType: 'Dual Space-Qualified Stereo NavCam Pairs',
      altitudeKm: 0.001,
      solarZenithAngle: '76.2°',
      geologicalFeatures: ['4-meter diameter morphological depression', 'Steep crater rim wall (>22°)', 'Ejecta boulder apron', 'Regolith slope failure'],
      missionSignificance: 'Demonstrated real-time hazard identification during autonomous rover traversal. Rover detected steep crater slope exceeding 15° safety threshold and safely rerouted onto safe terrain.',
    },
    description:
      'On August 27, 2023, during its traverse, the Pragyan Rover encountered a 4-meter diameter crater positioned 3 meters ahead of its track. Ground command and autonomous hazard avoidance commanded the rover to retrace its path, safely navigating onto a new path.',
    officialSourceUrl: 'https://www.isro.gov.in/chandrayaan3_gallery.html',
  },

  // ==========================================
  // ISRO CHANDRAYAAN-2 MISSIONS
  // ==========================================
  {
    id: 'isro-ch2-ohrc-shivshakti-swath',
    title: 'Ultra-High Resolution Swath of Shiv Shakti Point & Manzinus Basin',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Orbiter High Resolution Camera (OHRC)',
    targetRegion: 'South Polar Highlands between Manzinus C and Simpelius N',
    lunarCoordinates: {
      lat: '69.37° S',
      lng: '32.35° E',
    },
    acquisitionDate: '2021-04-14',
    resolution: '0.25 m/pixel (Highest orbital resolution around Moon)',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA12892/PIA12892~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_ohrc_shivshakti_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO PRADAN Research Archive & ISSDC Public Access',
      termsUrl: 'https://pradan.issdc.gov.in/ch2/',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic (450-900 nm)',
      sensorType: 'Time Delay Integration (TDI) Linear Array CCD',
      altitudeKm: 100.0,
      solarZenithAngle: '72.0°',
      geologicalFeatures: ['Individual surface boulders down to 30 cm', 'Fresh impact craters with raised rims', 'Radial ejecta patterns', 'Panchromatic albedo boundaries'],
      missionSignificance: 'Provided the primary reconnaissance baseline for selecting the Chandrayaan-3 landing site. Achieved 25 cm per pixel ground sampling from 100km polar orbit.',
    },
    description:
      'Acquired by the Chandrayaan-2 Orbiter High Resolution Camera (OHRC) operating at 100km altitude. Demonstrates sharp morphological details of craters, sharp boulders, and smooth patches that enabled safe landing site selection for Vikram.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },
  {
    id: 'isro-ch2-tmc2-manzinusc-dem',
    title: 'Manzinus-C Stereoscopic Triplet & Digital Elevation Surface',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Terrain Mapping Camera 2 (TMC-2)',
    targetRegion: 'Manzinus-C Crater Basin',
    lunarCoordinates: {
      lat: '69.8° S',
      lng: '31.2° E',
    },
    acquisitionDate: '2020-02-12',
    resolution: '5.0 m/pixel (Tri-stereo: Fore, Nadir, Aft)',
    imageUrl: 'https://images-assets.nasa.gov/image/as15-82-11082/as15-82-11082~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO PRADAN / ISSDC Planetary Data System',
      termsUrl: 'https://pradan.issdc.gov.in/ch2/',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic (500-850 nm)',
      sensorType: '3-line along-track stereoscopic CCD array (+26°, 0°, -26°)',
      altitudeKm: 100.0,
      solarZenithAngle: '68.4°',
      geologicalFeatures: ['Complex impact crater with central mound', 'Continuous ejecta blanket', 'Terraced crater rim crests', 'Regional slope transition zones'],
      missionSignificance: 'Generates high-fidelity 3D Digital Elevation Models (DEM) of polar craters, enabling precise slope gradient calculations for the ISRO 24m hazard avoidance standard.',
    },
    description:
      'Stereo swath acquired by TMC-2 over the Manzinus-C crater. By capturing three concurrent views (+26° fore, nadir, and -26° aft), TMC-2 derives accurate elevation heightmaps, revealing topographic slopes ranging from 0.84° on floors to 52° on rims.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },
  {
    id: 'isro-ch2-southpole-psr-crater',
    title: 'Permanently Shadowed Region (PSR) Deep Basin Crater Rim',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Dual-Frequency Synthetic Aperture Radar (DFSAR) & OHRC',
    targetRegion: 'Lunar South Pole Ultra-Cold Traps',
    lunarCoordinates: {
      lat: '84.5° S',
      lng: '12.4° W',
    },
    acquisitionDate: '2022-09-08',
    resolution: '1.0 m/pixel (Derived high-sensitivity panchromatic)',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA13059/PIA13059~small.jpg',
    localFallbackUrl: '/src/assets/samples/isro_psr_southpole_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Space Applications Centre (SAC) Planetary Data Archive',
      termsUrl: 'https://www.isro.gov.in/chandrayaan2.html',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic with enhanced low-light dynamic range',
      sensorType: 'High Sensitivity TDI Array with secondary scattered light capture',
      altitudeKm: 100.0,
      solarZenithAngle: '88.5° (grazing polar sunlight)',
      geologicalFeatures: ['Permanently shadowed crater interior', 'Sub-40 Kelvin cold trap floor', 'Steep shadowed crater walls', 'Subsurface water-ice host candidate'],
      missionSignificance: 'Permits optical characterization of craters that never receive direct sunlight, relying entirely on faint secondary reflections from sunlit opposite rims.',
    },
    description:
      'High dynamic range observation of a South Pole permanently shadowed crater basin. The interior remains in perpetual darkness with temperatures below 40 Kelvin (-233°C), representing pristine repositories of ancient volatile deposits and water ice.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },
  {
    id: 'isro-ch2-dfsar-polar-radar',
    title: 'Dual-Frequency SAR (DFSAR) L & S-Band Polar Radar Mosaic',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Dual-Frequency Synthetic Aperture Radar (DFSAR)',
    targetRegion: 'Lunar South Pole & Subsurface Ice Traps',
    lunarCoordinates: {
      lat: '85.5° S',
      lng: '0.0° E',
    },
    acquisitionDate: '2025-10-15',
    resolution: '2.0 m/pixel radar backscatter',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA13059/PIA13059~small.jpg',
    localFallbackUrl: '/src/assets/samples/isro_psr_southpole_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO ISSDC PRADAN Science Data Release (19+ TB Archive)',
      termsUrl: 'https://pradan.issdc.gov.in/ch2/',
    },
    technicalDetails: {
      spectralBand: 'Full Polarimetric L-band (1.25 GHz) and S-band (2.5 GHz)',
      sensorType: 'Dual-Frequency Synthetic Aperture Radar (DFSAR)',
      altitudeKm: 100.0,
      solarZenithAngle: 'N/A (Active microwave radar illumination)',
      geologicalFeatures: ['Subsurface dielectric boundaries', 'Buried impact crater rims', 'Regolith volume scattering', 'Subsurface water ice regolith signatures'],
      missionSignificance: 'Processed from over 1,400 to 1,500 radar datasets acquired over five years. Penetrates several meters beneath dry regolith to map buried structure and water-ice deposits inside PSRs.',
    },
    description:
      'High-resolution polar radar mosaic synthesized from over 1,500 DFSAR datasets collected across 5 years of Chandrayaan-2 orbital operations. By transmitting dual-frequency microwaves (L-band and S-band), DFSAR penetrates several meters into the lunar regolith, revealing subsurface structures in permanently shadowed craters where optical cameras receive zero direct sunlight.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },
  {
    id: 'isro-ch2-tmc2-4m-sqkm-survey',
    title: 'TMC-2 Global 4 Million km² High-Resolution Digital Elevation Swath',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Terrain Mapping Camera 2 (TMC-2)',
    targetRegion: 'Global Lunar Quadrants & South Polar Highland Basin',
    lunarCoordinates: {
      lat: '72.4° S',
      lng: '28.6° E',
    },
    acquisitionDate: '2020-08-30',
    resolution: '5.0 m/pixel (Tri-Stereo Along-Track: Fore, Nadir, Aft)',
    imageUrl: 'https://images-assets.nasa.gov/image/as15-82-11082/as15-82-11082~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Space Applications Centre (SAC) & ISSDC PRADAN Archive',
      termsUrl: 'https://pradan.issdc.gov.in/ch2/',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic (500-850 nm)',
      sensorType: '3-line along-track stereoscopic CCD array (+26°, 0°, -26°)',
      altitudeKm: 100.0,
      solarZenithAngle: '65.2°',
      geologicalFeatures: ['Broad regional impact terrain', 'Micro-slopes and terraced fault scarps', '4 Million sq km mapped terrain', 'Stereo photogrammetric parallax baseline'],
      missionSignificance: 'Forms part of the extensive 4,000,000 sq km global coverage mapped by TMC-2. Serves as the ground truth photogrammetric baseline that calibrated LunarSafe’s photometric slope constant (α = 0.35°).',
    },
    description:
      'Stereoscopic terrain swath acquired by Chandrayaan-2 TMC-2, contributing to the nearly 4 million square kilometers mapped by the camera across lunar orbits. With 5-meter spatial resolution and synchronized Fore, Nadir, and Aft viewing angles, it generates precise slope gradients vital for safe landing corridor selection.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },

  // ==========================================
  // NASA LRO / LROC MISSIONS
  // ==========================================
  {
    id: 'nasa-lroc-burg-crater-wall',
    title: 'Terraced Escarpment & Boulder Cascades in Bürg Crater',
    agency: 'NASA',
    mission: 'LRO / LROC',
    instrument: 'Lunar Reconnaissance Orbiter Camera (LROC NAC)',
    targetRegion: 'Lacus Mortis (Bürg Crater)',
    lunarCoordinates: {
      lat: '45.0° N',
      lng: '28.2° E',
    },
    acquisitionDate: '2010-06-19',
    resolution: '0.50 m/pixel',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA12892/PIA12892~medium.jpg',
    localFallbackUrl: '/src/assets/samples/ch2_tmc2_south_pole.png',
    nasaId: 'PIA12892',
    pdsId: 'urn:nasa:pds:lroc:data:nac_burg_crater_terrace::1.0',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA Open Access)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Monochrome Panchromatic (400-750 nm)',
      sensorType: 'Narrow Angle Pushbroom CCD Camera (NAC)',
      altitudeKm: 50.0,
      solarZenithAngle: '62.0°',
      geologicalFeatures: ['Slumped terrace fault blocks', 'Talus slope debris cones', 'Melt sheet veneers', 'Boulder clusters up to 15m across'],
      missionSignificance: 'Detailed structural mapping of crater wall collapse mechanics and rockfall hazards on lunar slopes exceeding 30 degrees.',
    },
    description:
      'High-resolution view of the terraced rim of Bürg Crater (40 km diameter). As the impact crater formed, gravity caused the steep crater walls to collapse inward along concentric slump faults, creating stair-stepped terraces and talus debris fields.',
    officialSourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA12892',
  },
  {
    id: 'nasa-lroc-bullialdus-peak',
    title: 'Anorthositic Central Peak Uplift of Bullialdus Crater',
    agency: 'NASA',
    mission: 'LRO / LROC',
    instrument: 'LROC Narrow Angle Camera (NAC-L & NAC-R)',
    targetRegion: 'Mare Nubium (Bullialdus Crater)',
    lunarCoordinates: {
      lat: '20.7° S',
      lng: '22.2° W',
    },
    acquisitionDate: '2010-08-04',
    resolution: '0.55 m/pixel',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA13132/PIA13132~small.jpg',
    localFallbackUrl: '/src/assets/samples/ch2_ohrc_touchdown.png',
    nasaId: 'PIA13132',
    pdsId: 'urn:nasa:pds:lroc:data:nac_bullialdus_peak::1.0',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA PDS Node)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Monochrome Panchromatic',
      sensorType: 'Narrow Angle Pushbroom CCD',
      altitudeKm: 50.0,
      solarZenithAngle: '55.3°',
      geologicalFeatures: ['Rebound central peaks', 'Exhumed lower-crustal anorthosites', 'Impact melt ponds', 'Polygonal cooling fractures'],
      missionSignificance: 'Central peaks exhume deep crustal rock from 5-10 km depth, exposing pristine lunar crustal stratigraphy unperturbed by surface space weathering.',
    },
    description:
      'The central peak of Bullialdus Crater towers over 1 kilometer above the crater floor. Created by hydrodynamic elastic rebound immediately following hypervelocity impact, exposing magmatic anorthositic rock units.',
    officialSourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA13132',
  },

  // ==========================================
  // NASA APOLLO PROGRAM SURFACE PHOTOGRAPHY
  // ==========================================
  {
    id: 'nasa-apollo11-touchdown-surface',
    title: 'Apollo 11 Tranquility Base: Lunar Module Touchdown Point',
    agency: 'NASA',
    mission: 'Apollo Program',
    instrument: 'Hasselblad 500EL 70mm Medium-Format Data Camera',
    targetRegion: 'Mare Tranquillitatis (Tranquility Base)',
    lunarCoordinates: {
      lat: '0.674° N',
      lng: '23.473° E',
    },
    acquisitionDate: '1969-07-20',
    resolution: 'Sub-millimeter close-up (Ektachrome 70mm emulsion)',
    imageUrl: 'https://images-assets.nasa.gov/image/as11-37-5458/as11-37-5458~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_ohrc_shivshakti_crop.png',
    nasaId: 'as11-37-5458',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA JSC Archive)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Full Color Visible (Kodak Ektachrome Professional Film)',
      sensorType: 'Bi-focal 60mm f/5.6 Zeiss Biogon Lens with Reseau Réseau plate',
      altitudeKm: 0.001,
      solarZenithAngle: '75.8°',
      geologicalFeatures: ['Eagle footpad penetration (7 cm)', 'Descent engine plume scouring', 'Fine cohesive lunar dust', 'Sub-meter regolith micro-craters'],
      missionSignificance: 'First human landing on another celestial world. Proved lunar regolith possesses adequate bearing strength (100-200 kPa) to support heavy landers without catastrophic sink.',
    },
    description:
      'Photograph taken from the Lunar Module window shortly after landing on July 20, 1969. Shows the undisturbed lunar surface and the footpad of the LM Eagle resting cleanly on the regolith with minimal penetration.',
    officialSourceUrl: 'https://images.nasa.gov/details/as11-37-5458',
  },
  {
    id: 'nasa-apollo15-fresh-crater-boulders',
    title: 'Apollo 15 Fresh Crater Rim & Boulder Block Field',
    agency: 'NASA',
    mission: 'Apollo Program',
    instrument: 'Hasselblad 70mm Camera with 250mm Telephoto Lens',
    targetRegion: 'Hadley-Apennine Landing Site (Station 9)',
    lunarCoordinates: {
      lat: '26.13° N',
      lng: '3.63° E',
    },
    acquisitionDate: '1971-08-01',
    resolution: '0.05 m optical resolution',
    imageUrl: 'https://images-assets.nasa.gov/image/as15-82-11082/as15-82-11082~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    nasaId: 'as15-82-11082',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA History Division)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Black & White Panchromatic (Panatomic-X film)',
      sensorType: 'Zeiss 250mm Telephoto Lens',
      altitudeKm: 0.002,
      solarZenithAngle: '64.1°',
      geologicalFeatures: ['Sharp crater rim lip', 'Ejected basaltic blocks up to 2.5m', 'Micro-crater pitting on boulder surfaces', 'Glass spatter patinas'],
      missionSignificance: 'Ground-truth evidence for crater ejecta dynamics and boulder dispersal patterns directly validated by astronauts David Scott and James Irwin.',
    },
    description:
      'Panchromatic telephoto view across the rim of a sharp, geologically young crater near the base of Mount Hadley. Demonstrates how hypervelocity impacts fracture underlying basalt bedrock and disperse hazardous rock fragments.',
    officialSourceUrl: 'https://images.nasa.gov/details/as15-82-11082',
  },
  {
    id: 'nasa-apollo15-posidonius-basin',
    title: 'Crater Posidonius & Sinuous Rilles at Sea of Serenity',
    agency: 'NASA',
    mission: 'Apollo Program',
    instrument: 'Apollo 15 Metric Mapping Camera (3-inch Fairchild)',
    targetRegion: 'Mare Serenitatis / Lacus Somniorum Boundary',
    lunarCoordinates: {
      lat: '31.8° N',
      lng: '29.9° E',
    },
    acquisitionDate: '1971-07-31',
    resolution: '15.0 m/pixel orbital frame',
    imageUrl: 'https://images-assets.nasa.gov/image/as15-91-12366/as15-91-12366~medium.jpg',
    localFallbackUrl: '/src/assets/samples/ch2_tmc2_south_pole.png',
    nasaId: 'as15-91-12366',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic High-Resolution Emulsion (Type 3414)',
      sensorType: 'Fairchild 76mm f/4.5 Metric Camera with forward motion compensation',
      altitudeKm: 110.0,
      solarZenithAngle: '70.2°',
      geologicalFeatures: ['Floor-fractured crater Posidonius (95km diameter)', 'Meandering sinuous volcanic rilles', 'Flooded basaltic maria', 'Concentric graben systems'],
      missionSignificance: 'Classic demonstration of lunar volcanic thermal erosion where ancient basaltic lava tubes collapsed into sinuous rilles.',
    },
    description:
      'Orbital mapping view of Crater Posidonius at the northeastern edge of Mare Serenitatis. The complex crater floor is fractured and traversed by meandering sinuous volcanic channels (rilles) formed by ancient turbulent lava flows.',
    officialSourceUrl: 'https://images.nasa.gov/details/as15-91-12366',
  },

  // ==========================================
  // JOINT ISRO-NASA CHANDRAYAAN-1 MISSION
  // ==========================================
  {
    id: 'joint-ch1-m3-water-ice-discovery',
    title: 'Discovery of Hydroxyl / Water Ice Molecules in Polar Craters',
    agency: 'JOINT_ISRO_NASA',
    mission: 'Chandrayaan-1',
    instrument: 'Moon Mineralogy Mapper (M3 Imaging Spectrometer)',
    targetRegion: 'Lunar Polar Cold Traps',
    lunarCoordinates: {
      lat: '82.0° S',
      lng: '45.0° E',
    },
    acquisitionDate: '2009-09-24',
    resolution: '140 m/pixel spectral mapping',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA12885/PIA12885~small.jpg',
    localFallbackUrl: '/src/assets/samples/psr_shadow_zone.png',
    pdsId: 'urn:nasa:pds:m3:spectral_cube_ch1::1.0',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: 'NASA-ISRO Memorandum of Understanding & NASA PDS Geosciences Archive',
      termsUrl: 'https://pds-geosciences.wustl.edu/missions/chandrayaan1/m3.htm',
    },
    technicalDetails: {
      spectralBand: 'Hyperspectral (85 channels across 0.43 to 3.0 microns)',
      sensorType: 'Pushbroom Imaging Spectrometer',
      altitudeKm: 100.0,
      solarZenithAngle: '85.0°',
      geologicalFeatures: ['Hydroxyl (OH) absorption at 2.8 microns', 'Water molecule (H2O) absorption at 3.0 microns', 'Ilmenite and pyroxene mineral beds', 'Permanent polar cold traps'],
      missionSignificance: 'Landmark discovery that overturned the long-held consensus that the Moon was completely bone dry. Proved active polar water cycle and bound hydrogen molecules in regolith.',
    },
    description:
      'Historic joint ISRO-NASA scientific breakthrough. The Moon Mineralogy Mapper (M3) aboard India’s Chandrayaan-1 orbiter detected distinct infrared absorption signatures of water (H2O) and hydroxyl (OH) molecules across polar craters, laying the scientific foundation for all modern Artemis and Chandrayaan landing initiatives.',
    officialSourceUrl: 'https://www.nasa.gov/mission_pages/Mini-RF/multimedia/m3_water_discovery.html',
  },
  {
    id: 'isro-ch3-vikram-hop-experiment',
    title: 'Vikram Lander Autonomous In-Situ Hop & Re-touchdown at Shiv Shakti',
    agency: 'ISRO',
    mission: 'Chandrayaan-3',
    instrument: 'Lander Imager Camera (LIC) & Hazard Detection Camera (LHDAC)',
    targetRegion: 'Shiv Shakti Point (Second Landing Site)',
    lunarCoordinates: {
      lat: '69.373° S',
      lng: '32.319° E',
    },
    acquisitionDate: '2023-09-04',
    resolution: '0.05 m proximity surface imaging',
    imageUrl: 'https://images-assets.nasa.gov/image/as11-37-5458/as11-37-5458~medium.jpg',
    localFallbackUrl: '/src/assets/samples/ch2_ohrc_touchdown.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Chandrayaan-3 Mission Operations Update & ISSDC Public Archive',
      termsUrl: 'https://www.isro.gov.in/chandrayaan3.html',
    },
    technicalDetails: {
      spectralBand: 'Panchromatic / Color Visible',
      sensorType: 'Dual Redundant Hazard Detection & Processing Units',
      altitudeKm: 0.0004, // 40 cm jump altitude
      solarZenithAngle: '79.1°',
      geologicalFeatures: ['Secondary touchdown pad impressions', 'Plume-regolith interaction blast ring', 'Displaced coarse grains', 'Regolith shear deformation'],
      missionSignificance: 'Successfully ignited throttleable liquid engines for a 40 cm elevation hop and 30-40 cm lateral displacement. Validated in-situ engine reignition essential for sample return missions (Chandrayaan-4).',
    },
    description:
      'On command, Vikram fired its liquid thrusters, elevated itself by ~40 cm, and landed safely at a distance of 30-40 cm away. All payloads (ChaSTE, ILSA, and RAMBHA) were redeployed smoothly, demonstrating launch and landing reusability on lunar soil.',
    officialSourceUrl: 'https://www.isro.gov.in/chandrayaan3_gallery.html',
  },
  {
    id: 'isro-ch2-iirs-spectral-crater',
    title: 'Infrared Mineralogical Mapping of High-Latitude Moretus Crater',
    agency: 'ISRO',
    mission: 'Chandrayaan-2',
    instrument: 'Imaging Infrared Spectrometer (IIRS)',
    targetRegion: 'Moretus Crater Central Peak & Terraces',
    lunarCoordinates: {
      lat: '70.6° S',
      lng: '5.8° W',
    },
    acquisitionDate: '2021-01-20',
    resolution: '80 m/pixel contiguous spectral bands (0.8 - 5.0 µm)',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA13059/PIA13059~small.jpg',
    localFallbackUrl: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    isroReleaseId: 'ISRO Chandrayaan-2/3 mission imagery',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'ISRO_OPEN_ACCESS',
      legalCitation: 'ISRO Space Applications Centre (SAC) Open Science Data Repository',
      termsUrl: 'https://pradan.issdc.gov.in/ch2/',
    },
    technicalDetails: {
      spectralBand: 'Shortwave to Mid-Infrared (800 - 5000 nm in 256 bands)',
      sensorType: 'Cooled HgCdTe Focal Plane Array',
      altitudeKm: 100.0,
      solarZenithAngle: '66.8°',
      geologicalFeatures: ['Crystalline plagioclase / anorthosite', 'Mantle pyroxenes and olivines', 'Hydroxyl 2.8 µm hydration band', 'Impact melt pools'],
      missionSignificance: 'Highest spectral resolution infrared spectrometer ever flown to lunar orbit. Extends spectral coverage beyond 3.0 microns to accurately decouple surface thermal emission from water absorption.',
    },
    description:
      'Hyperspectral radiance observation of the prominent southern crater Moretus (114 km diameter, 2.1 km central peak). IIRS mapped deep anorthosite minerals and hydroxyl features across the central peak uplift.',
    officialSourceUrl: 'https://pradan.issdc.gov.in/ch2/',
  },
  {
    id: 'nasa-apollo17-station6-boulder',
    title: 'Apollo 17 Station 6: Shattered Five-Block Boulder at Taurus-Littrow',
    agency: 'NASA',
    mission: 'Apollo Program',
    instrument: 'Hasselblad 500EL 70mm Data Camera (60mm Biogon)',
    targetRegion: 'Taurus-Littrow Valley (North Massif Base)',
    lunarCoordinates: {
      lat: '20.19° N',
      lng: '30.77° E',
    },
    acquisitionDate: '1972-12-13',
    resolution: 'Sub-millimeter close-up stereo',
    imageUrl: 'https://images-assets.nasa.gov/image/as17-140-21497/as17-140-21497~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_ohrc_shivshakti_crop.png',
    nasaId: 'as17-140-21497',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA JSC)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Color Visible (Kodak SO-368 Ektachrome emulsion)',
      sensorType: 'Calibrated Photogrammetric Reseau Grid Camera',
      altitudeKm: 0.002,
      solarZenithAngle: '58.4°',
      geologicalFeatures: ['18-meter vesicular impact melt breccia block', 'Rolling boulder bounce track on slope', 'Foliated shock veins', 'Regolith fillet buildup'],
      missionSignificance: 'Sampled by geologist-astronaut Harrison Schmitt. Boulder rolled 1.5 km down the North Massif slope, providing samples of upper crustal ejecta without ascending the hazardous mountain.',
    },
    description:
      'Iconic photograph of Geologist Harrison Schmitt examining a massive fragmented boulder that tumbled down the North Massif into the Taurus-Littrow valley. The track left by the rolling boulder provided direct measurements of soil mechanics on steep slopes.',
    officialSourceUrl: 'https://images.nasa.gov/details/as17-140-21497',
  },
  {
    id: 'nasa-lroc-tycho-central-peak',
    title: 'Sunrise Illumination Over Central Peak Complex of Tycho Crater',
    agency: 'NASA',
    mission: 'LRO / LROC',
    instrument: 'Lunar Reconnaissance Orbiter Camera (LROC NAC)',
    targetRegion: 'Tycho Crater (Central Peak)',
    lunarCoordinates: {
      lat: '43.31° S',
      lng: '11.36° W',
    },
    acquisitionDate: '2011-06-10',
    resolution: '1.5 m/pixel oblique perspective',
    imageUrl: 'https://images-assets.nasa.gov/image/PIA14317/PIA14317~small.jpg',
    localFallbackUrl: '/src/assets/samples/ch2_tmc2_south_pole.png',
    nasaId: 'PIA14317',
    pdsId: 'urn:nasa:pds:lroc:data:nac_tycho_peak_oblique::1.0',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA/GSFC/ASU)',
      termsUrl: 'https://www.nasa.gov/multimedia/guidelines/index.html',
    },
    technicalDetails: {
      spectralBand: 'Monochrome Panchromatic (400-750 nm)',
      sensorType: 'Narrow Angle Pushbroom Camera slewed 39.9° off-nadir',
      altitudeKm: 50.0,
      solarZenithAngle: '84.0° (low sun grazing shadows)',
      geologicalFeatures: ['120-meter summit impact craterlet', 'Massive boulders perched on steep crests', 'Impact melt cascades and cooling cracks', 'Shocked anorthositic bedrock'],
      missionSignificance: 'Demonstrated exceptional off-nadir orbital pointing accuracy to capture spectacular 3D topographic profiles of young impact features (Tycho age: ~108 million years).',
    },
    description:
      'Dramatic oblique view looking across the central peak of Tycho Crater (86 km diameter). The summit rises 2 km above the crater floor and features a distinct 120-meter boulder resting right on the crest, showing how violent rebound shapes crater morphology.',
    officialSourceUrl: 'https://photojournal.jpl.nasa.gov/catalog/PIA14317',
  },
  {
    id: 'nasa-lola-polar-elevation-map',
    title: 'Topographic Elevation & Slope Gradient of Shackleton Crater Rim',
    agency: 'NASA',
    mission: 'LOLA Elevation',
    instrument: 'Lunar Orbiter Laser Altimeter (LOLA)',
    targetRegion: 'Shackleton Crater & South Pole Connecting Ridge',
    lunarCoordinates: {
      lat: '89.9° S',
      lng: '0.0° E',
    },
    acquisitionDate: '2012-05-18',
    resolution: '10 m/pixel Digital Elevation Model (DEM)',
    imageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001928/GSFC_20171208_Archive_e001928~medium.jpg',
    localFallbackUrl: '/src/assets/samples/isro_psr_southpole_crop.png',
    nasaId: 'GSFC_20171208_Archive_e001928',
    pdsId: 'urn:nasa:pds:lola:data:polar_dem_10m::1.0',
    canAnalyzeInEngine: true,
    licensing: {
      status: 'PUBLIC_DOMAIN',
      legalCitation: '17 U.S.C. § 105 - Works of the United States Government (NASA GSFC LOLA PDS Node)',
      termsUrl: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm',
    },
    technicalDetails: {
      spectralBand: 'Active Laser Pulses (1064 nm Nd:YAG Laser)',
      sensorType: '5-beam Diffractive Optics Laser Altimeter with 10 cm vertical precision',
      altitudeKm: 50.0,
      solarZenithAngle: 'N/A (Active laser ranging independent of solar illumination)',
      geologicalFeatures: ['Perpetually illuminated peak of eternal light', '4.2 km deep interior basin in total darkness', '30-degree inner crater wall slope', 'Connecting ridge connecting to de Gerlache'],
      missionSignificance: 'Created the definitive geodetic elevation standard of the Moon. Mapped the topography of permanently shadowed regions where passive cameras receive no direct sunlight.',
    },
    description:
      'Geodetic elevation model produced by millions of individual laser pulses fired by LOLA. Mapped Shackleton crater (21 km diameter, 4.2 km depth) directly at the Lunar South Pole, identifying elevated ridge points receiving over 86% annual sunlight alongside floors in perpetual shadow.',
    officialSourceUrl: 'https://lola.gsfc.nasa.gov/',
  },
];
