export type AgentIntent =
  | 'LAST_SCAN'
  | 'COMPONENT_STATUS'
  | 'HASH_CHAIN'
  | 'RECOMMENDATION'
  | 'ENVIRONMENT'
  | 'SLOPE_PHYSICS'
  | 'ISRO_24M_GRID'
  | 'CRATER_BOULDER_HAZARDS'
  | 'HORN_DEM_MATH'
  | 'UNCERTAINTY_CLASSIFICATION'
  | 'MISSION_DATASETS'
  | 'SCIENTIFIC_PAPERS'
  | 'FEATURES_HOWTO'
  | 'GREETING'
  | 'LUNAR_GENERAL'
  | 'NASA_PDS_FETCH'
  | 'OUT_OF_SCOPE';

export function classifyIntent(question: string): AgentIntent {
  const q = question.toLowerCase().trim();

  // 1. LAST_SCAN
  if (
    q.includes('last scan') ||
    q.includes('previous scan') ||
    q.includes('recent scan') ||
    q.includes('last run') ||
    q.includes('result of the last scan') ||
    q.includes('latest scan') ||
    q.includes('last scan i ran') ||
    q.includes('what did i scan') ||
    q.includes('scanned last')
  ) {
    return 'LAST_SCAN';
  }

  // 2. COMPONENT_STATUS
  if (
    q.includes('component') ||
    q.includes('online') ||
    q.includes('health') ||
    q.includes('system status') ||
    q.includes('status') ||
    q.includes('subsystem') ||
    q.includes('modules status') ||
    q.includes('pipeline status')
  ) {
    return 'COMPONENT_STATUS';
  }

  // 3. HASH_CHAIN
  if (
    q.includes('hash chain') ||
    q.includes('4 hashes') ||
    q.includes('four hashes') ||
    q.includes('stage1') ||
    q.includes('stage2') ||
    q.includes('stage3') ||
    q.includes('stage4') ||
    q.includes('cryptographic chain') ||
    q.includes('sha256') ||
    q.includes('sha-256') ||
    q.includes('immutability') ||
    q.includes('bit-identical')
  ) {
    return 'HASH_CHAIN';
  }

  // 4. RECOMMENDATION
  if (
    q.includes('safe to land') ||
    q.includes('is the landing site safe') ||
    q.includes('is it safe') ||
    q.includes('landing site safe') ||
    q.includes('landing decision') ||
    q.includes('landing recommendation') ||
    q.includes('can we land') ||
    q.includes('should we land') ||
    q.includes('safe landing') ||
    q.includes('landing safety') ||
    q.includes('abort criteria') ||
    q.includes('go or no go') ||
    q.includes('go/no-go') ||
    q.includes('flight recommendation') ||
    q.includes('recommendation for landing')
  ) {
    return 'RECOMMENDATION';
  }

  // 5. ENVIRONMENT
  if (
    q.includes('environment') ||
    q.includes('node version') ||
    q.includes('platform') ||
    q.includes('port') ||
    q.includes('operating system') ||
    q.includes('runtime environment')
  ) {
    return 'ENVIRONMENT';
  }

  // 6. GREETING & SELF-INTRO
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.startsWith('hey ') ||
    q.includes('greetings') ||
    q.includes('who are you') ||
    q.includes('what can you do') ||
    q.includes('introduce yourself') ||
    q.includes('help me') ||
    q === 'help'
  ) {
    return 'GREETING';
  }

  // 7. SLOPE_PHYSICS & LANDER DYNAMICS
  if (
    q.includes('10°') ||
    q.includes('10 degree') ||
    q.includes('10 deg') ||
    q.includes('tip over') ||
    q.includes('tip-over') ||
    q.includes('rollover') ||
    q.includes('strut crush') ||
    q.includes('landing gear') ||
    q.includes('leg spread') ||
    q.includes('why 10') ||
    q.includes('slope limit') ||
    q.includes('slope constraint') ||
    q.includes('slope threshold') ||
    q.includes('vikram stability')
  ) {
    return 'SLOPE_PHYSICS';
  }

  // 8. ISRO 24M GRID STANDARD
  if (
    q.includes('24m') ||
    q.includes('24 meter') ||
    q.includes('24x24') ||
    q.includes('grid standard') ||
    q.includes('grid cell') ||
    q.includes('why 24') ||
    q.includes('cell size') ||
    q.includes('plume scouring') ||
    q.includes('plume impingement') ||
    q.includes('dispersion')
  ) {
    return 'ISRO_24M_GRID';
  }

  // 9. CRATER & BOULDER HAZARDS
  if (
    q.includes('crater') ||
    q.includes('boulder') ||
    q.includes('rock') ||
    q.includes('obstacle') ||
    q.includes('hazard') ||
    q.includes('depth estimation') ||
    q.includes('30cm') ||
    q.includes('30 cm') ||
    q.includes('shadow length') ||
    q.includes('consolidation') ||
    q.includes('disjoint set') ||
    q.includes('patch')
  ) {
    return 'CRATER_BOULDER_HAZARDS';
  }

  // 10. HORN (1981) DEM & SOBEL MATH
  if (
    q.includes('horn') ||
    q.includes('sobel') ||
    q.includes('dem slope') ||
    q.includes('gradient') ||
    q.includes('finite difference') ||
    q.includes('partial derivative') ||
    q.includes('photometric') ||
    q.includes('albedo') ||
    q.includes('sun angle')
  ) {
    return 'HORN_DEM_MATH';
  }

  // 11. UNCERTAINTY & CONSERVATIVE CLASSIFICATION
  if (
    q.includes('uncertainty') ||
    q.includes('sigma') ||
    q.includes('smith et al') ||
    q.includes('conservative') ||
    q.includes('error propagation') ||
    q.includes('marginal site') ||
    q.includes('confidence bound') ||
    q.includes('sensitivity')
  ) {
    return 'UNCERTAINTY_CLASSIFICATION';
  }

  // 12. DATASETS & DEMO TARGETS
  if (
    q.includes('tmc2') ||
    q.includes('tmc-2') ||
    q.includes('ohrc') ||
    q.includes('shiv shakti') ||
    q.includes('shivshakti') ||
    q.includes('manzinus') ||
    q.includes('lroc') ||
    q.includes('shackleton') ||
    q.includes('chandrayaan-2') ||
    q.includes('chandrayaan-3')
  ) {
    return 'MISSION_DATASETS';
  }

  // 13. SCIENTIFIC PAPERS & ISRO AUTHORS
  if (
    q.includes('veeramuthuvel') ||
    q.includes('somanath') ||
    q.includes('amitabh') ||
    q.includes('gopala krishna') ||
    q.includes('durga prasad') ||
    q.includes('rosenburg') ||
    q.includes('zuber') ||
    q.includes('paper') ||
    q.includes('journal') ||
    q.includes('citation') ||
    q.includes('peer review') ||
    q.includes('research') ||
    q.includes('dossier')
  ) {
    return 'SCIENTIFIC_PAPERS';
  }

  // 14. FEATURES & HOW TO USE
  if (
    q.includes('how to use') ||
    q.includes('how do i use') ||
    q.includes('how does this work') ||
    q.includes('features') ||
    q.includes('feature') ||
    q.includes('3d relief') ||
    q.includes('mesh') ||
    q.includes('pdf report') ||
    q.includes('export report') ||
    q.includes('space bag') ||
    q.includes('history panel') ||
    q.includes('batch comparison') ||
    q.includes('walkthrough') ||
    q.includes('guide') ||
    q.includes('gemini vision') ||
    q.includes('gemini narrative')
  ) {
    return 'FEATURES_HOWTO';
  }

  // 15. NASA PDS FETCH
  if (
    q.includes('nasa pds') ||
    q.includes('pds web api') ||
    q.includes('fetch live data') ||
    q.includes('query nasa') ||
    q.includes('live nasa data') ||
    q.includes('nasa api') ||
    q.includes('pds api')
  ) {
    return 'NASA_PDS_FETCH';
  }

  // 16. GENERAL LUNAR MISSION INQUIRIES
  if (
    q.includes('lunar mission overview') ||
    q.includes('moon mission overview') ||
    q.includes('chandrayaan mission overview') ||
    q.includes('apollo mission overview') ||
    q.includes('lunar exploration overview') ||
    q.includes('about lunar missions')
  ) {
    return 'LUNAR_GENERAL';
  }

  // 17. GENUINELY OUT OF SCOPE (France, sports, recipes, politics, etc.)
  return 'OUT_OF_SCOPE';
}
