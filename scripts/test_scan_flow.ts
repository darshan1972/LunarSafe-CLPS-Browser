import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log('RUNNING FULL PIPELINE SCAN TEST FOR OHRC AND TMC-2');
  console.log('================================================================\n');

  for (const sampleId of ['ohrc', 'tmc2']) {
    console.log(`----------------------------------------------------------------`);
    console.log(`TESTING SAMPLE: ${sampleId.toUpperCase()}`);
    console.log(`----------------------------------------------------------------`);

    // 1. Call /api/analyze
    const analyzeRes = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleId }),
    });

    if (!analyzeRes.ok) {
      console.error(`Analyze failed with HTTP ${analyzeRes.status}: ${await analyzeRes.text()}`);
      process.exit(1);
    }

    const engineOut = await analyzeRes.json();

    // 2. Read latest record from .scan_history.json
    const historyPath = path.resolve('.scan_history.json');
    const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const latestRecord = historyData[0];

    // 3. Query Agent OM via /api/agent-om
    const agentRes = await fetch('http://localhost:5000/api/agent-om', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What was the result of the last scan?' }),
    });
    const agentData = await agentRes.json();
    const agentReply = agentData.reply;

    console.log('\n--- 1. ENGINE OUTPUT (Relevant Fields) ---');
    console.log(JSON.stringify({
      instrument: sampleId === 'ohrc' ? 'OHRC' : 'TMC-2',
      hazardCount: engineOut.hazardCount ?? engineOut.hazardPatchCount ?? engineOut.craters.length,
      boulderCount: engineOut.boulderCount ?? engineOut.boulders.length,
      safeCellCount: engineOut.safeCellCount ?? engineOut.evidence.cellCountSafe,
      safeAreaPercentage: engineOut.safeAreaPercentage ?? engineOut.evidence.safeAreaPercentage,
      safeZoneCount: engineOut.safeZoneCount ?? engineOut.safeZones.length,
      topSiteAreaM2: engineOut.topSiteAreaM2 ?? (engineOut.safeZones[0]?.areaM2 || 0),
      meanSlopeDeg: Number(engineOut.meanSlopeDeg.toFixed(2)),
      frameMaxSlopeDeg: engineOut.frameMaxSlopeDeg ?? Number(engineOut.maxSlopeDeg.toFixed(2)),
      selectedZoneMaxSlopeDeg: engineOut.selectedZoneMaxSlopeDeg,
      recommendation: engineOut.recommendation,
      inputImageHash: engineOut.evidence.inputImageHash,
      candidateZonesHash: engineOut.evidence.candidateZonesHash,
    }, null, 2));

    console.log('\n--- 2. SCAN HISTORY RECORD (.scan_history.json[0]) ---');
    console.log(JSON.stringify({
      id: latestRecord.id,
      instrument: latestRecord.instrument,
      hazardCount: latestRecord.hazardCount ?? latestRecord.hazardPatchCount ?? latestRecord.craterCount,
      boulderCount: latestRecord.boulderCount,
      safeCellCount: latestRecord.safeCellCount,
      safeAreaPercentage: latestRecord.safeAreaPercentage,
      safeZoneCount: latestRecord.safeZoneCount ?? latestRecord.contiguousZoneCount,
      topSiteAreaM2: latestRecord.topSiteAreaM2,
      meanSlopeDeg: latestRecord.meanSlopeDeg,
      frameMaxSlopeDeg: latestRecord.frameMaxSlopeDeg ?? latestRecord.maxSlopeDeg,
      selectedZoneMaxSlopeDeg: latestRecord.selectedZoneMaxSlopeDeg,
      recommendation: latestRecord.recommendation,
      inputImageHash: latestRecord.inputImageHash,
      candidateZonesHash: latestRecord.candidateZonesHash,
    }, null, 2));

    console.log('\n--- 3. AGENT OM RESPONSE ---');
    console.log(agentReply);
    console.log('\n');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
