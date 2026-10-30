import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface EndpointResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number[];
  contentType?: string;
  payloadSummary: string;
  pass: boolean;
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestHttp(options: http.RequestOptions, body?: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testStream(port: number): Promise<EndpointResult> {
  return new Promise(resolve => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/stream',
      method: 'GET',
    }, res => {
      const contentType = res.headers['content-type'] || '';
      let chunkCount = 0;
      let firstChunk = '';

      res.on('data', chunk => {
        chunkCount++;
        firstChunk += chunk.toString();
        if (firstChunk.includes('SSE link established') || chunkCount >= 1) {
          req.destroy();
          resolve({
            endpoint: '/api/stream',
            method: 'GET',
            status: res.statusCode || 0,
            expectedStatus: [200],
            contentType,
            payloadSummary: `Received SSE handshake: ${firstChunk.trim().substring(0, 100)}...`,
            pass: res.statusCode === 200 && contentType.includes('text/event-stream'),
          });
        }
      });
    });

    req.on('error', err => {
      resolve({
        endpoint: '/api/stream',
        method: 'GET',
        status: 0,
        expectedStatus: [200],
        payloadSummary: `Error: ${err.message}`,
        pass: false,
      });
    });

    req.end();
  });
}

async function runAudit() {
  console.log('============================================================');
  console.log('          LUNARSAFE BACKEND SERVER ENDPOINTS AUDIT          ');
  console.log('============================================================\n');

  console.log('[STEP 1] Starting backend server (server.ts) on port 5000...');
  const serverProc: ChildProcess = spawn('npx', ['tsx', 'server.ts'], {
    cwd: process.cwd(),
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let serverStarted = false;
  serverProc.stdout?.on('data', data => {
    const text = data.toString();
    if (text.includes('port 5000') || text.includes('LunarSafe')) {
      serverStarted = true;
    }
  });

  serverProc.stderr?.on('data', data => {
    // console.error('[SERVER STDERR]:', data.toString());
  });

  // Wait up to 15s for server to start
  const startWait = Date.now();
  while (!serverStarted && Date.now() - startWait < 15000) {
    try {
      const res = await requestHttp({ hostname: '127.0.0.1', port: 5000, path: '/api/isro-datasets', method: 'GET' });
      if (res.status > 0) {
        serverStarted = true;
        break;
      }
    } catch {
      await wait(500);
    }
  }

  if (!serverStarted) {
    console.error('FAIL: Server failed to start on port 5000 within 15 seconds.');
    serverProc.kill();
    process.exit(1);
  }
  console.log('SUCCESS: Backend server started and responding on port 5000.\n');

  const results: EndpointResult[] = [];

  // 1. GET /api/isro-datasets
  console.log('[TEST 1] GET /api/isro-datasets');
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/isro-datasets',
      method: 'GET',
    });
    const json = JSON.parse(res.body);
    const pass = res.status === 200 && json.success === true && Array.isArray(json.files);
    results.push({
      endpoint: '/api/isro-datasets',
      method: 'GET',
      status: res.status,
      expectedStatus: [200],
      contentType: res.headers['content-type'],
      payloadSummary: `Files count: ${json.files?.length}, success: ${json.success}`,
      pass,
    });
    console.log(`  -> Status: ${res.status}, Files: ${json.files?.length}, Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/isro-datasets',
      method: 'GET',
      status: 0,
      expectedStatus: [200],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 2. POST /api/analyze-isro
  console.log('\n[TEST 2] POST /api/analyze-isro');
  try {
    const reqBody = JSON.stringify({ tileX: 1500, tileY: 20000, tileSize: 512 });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/analyze-isro',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
    }, reqBody);

    const json = JSON.parse(res.body);
    const scanId = json.scanId || json.scanRecord?.id || json.id;
    const pass = res.status === 200 && !!scanId && typeof json.meanSlopeDeg === 'number';
    results.push({
      endpoint: '/api/analyze-isro',
      method: 'POST',
      status: res.status,
      expectedStatus: [200],
      contentType: res.headers['content-type'],
      payloadSummary: `Scan ID: ${scanId}, Craters: ${json.hazardPatchCount ?? json.craters?.length}, Mean Slope: ${json.meanSlopeDeg}°`,
      pass,
    });
    console.log(`  -> Status: ${res.status}, Scan ID: ${scanId}, Mean Slope: ${json.meanSlopeDeg}°, Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/analyze-isro',
      method: 'POST',
      status: 0,
      expectedStatus: [200],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 3. POST /api/gemini/validate
  console.log('\n[TEST 3] POST /api/gemini/validate');
  try {
    const dummyImageBase64 = Buffer.from('fake-png-data').toString('base64');
    const reqBody = JSON.stringify({ imageBase64: dummyImageBase64, mimeType: 'image/png' });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/gemini/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
    }, reqBody);

    // If key not configured, 503 is expected and correct. If key configured, 200/400.
    const pass = res.status === 200 || res.status === 503;
    results.push({
      endpoint: '/api/gemini/validate',
      method: 'POST',
      status: res.status,
      expectedStatus: [200, 503],
      contentType: res.headers['content-type'],
      payloadSummary: res.body.substring(0, 80),
      pass,
    });
    console.log(`  -> Status: ${res.status} (Valid handling: 503 unconfigured or 200 live), Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/gemini/validate',
      method: 'POST',
      status: 0,
      expectedStatus: [200, 503],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 4. POST /api/gemini/narrative
  console.log('\n[TEST 4] POST /api/gemini/narrative');
  try {
    const reqBody = JSON.stringify({ scanRecord: { meanSlopeDeg: 2.1, maxSlopeDeg: 8.4, craterCount: 12, boulderCount: 8, safeAreaPercentage: 94.2 } });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/gemini/narrative',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
    }, reqBody);

    const pass = res.status === 200 || res.status === 503;
    results.push({
      endpoint: '/api/gemini/narrative',
      method: 'POST',
      status: res.status,
      expectedStatus: [200, 503],
      contentType: res.headers['content-type'],
      payloadSummary: res.body.substring(0, 80),
      pass,
    });
    console.log(`  -> Status: ${res.status} (Valid handling: 503 unconfigured or 200 live), Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/gemini/narrative',
      method: 'POST',
      status: 0,
      expectedStatus: [200, 503],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 5. POST /api/report/sign
  console.log('\n[TEST 5] POST /api/report/sign');
  let signedObj: any = null;
  const samplePdfBase64 = Buffer.from('%PDF-1.4 audit test payload').toString('base64');
  try {
    const reqBody = JSON.stringify({ pdfBase64: samplePdfBase64 });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/report/sign',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
    }, reqBody);

    signedObj = JSON.parse(res.body);
    const pass = res.status === 200 && !!signedObj.signature && !!signedObj.publicKey;
    results.push({
      endpoint: '/api/report/sign',
      method: 'POST',
      status: res.status,
      expectedStatus: [200],
      contentType: res.headers['content-type'],
      payloadSummary: `Algorithm: ${signedObj.algorithm}, Signature: ${signedObj.signature?.substring(0, 20)}...`,
      pass,
    });
    console.log(`  -> Status: ${res.status}, Algorithm: ${signedObj.algorithm}, Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/report/sign',
      method: 'POST',
      status: 0,
      expectedStatus: [200],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 6. POST /api/report/verify
  console.log('\n[TEST 6] POST /api/report/verify');
  try {
    const reqBody = JSON.stringify({ pdfBase64: samplePdfBase64, signedReport: signedObj });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/report/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
    }, reqBody);

    const json = JSON.parse(res.body);
    const pass = res.status === 200 && json.valid === true;
    results.push({
      endpoint: '/api/report/verify',
      method: 'POST',
      status: res.status,
      expectedStatus: [200],
      contentType: res.headers['content-type'],
      payloadSummary: `Valid: ${json.valid}`,
      pass,
    });
    console.log(`  -> Status: ${res.status}, Valid: ${json.valid}, Result: ${pass ? 'PASS' : 'FAIL'}`);
  } catch (err: any) {
    results.push({
      endpoint: '/api/report/verify',
      method: 'POST',
      status: 0,
      expectedStatus: [200],
      payloadSummary: err.message,
      pass: false,
    });
    console.log(`  -> Result: FAIL (${err.message})`);
  }

  // 7. GET /api/stream
  console.log('\n[TEST 7] GET /api/stream (SSE Telemetry)');
  const streamRes = await testStream(5000);
  results.push(streamRes);
  console.log(`  -> Status: ${streamRes.status}, Content-Type: ${streamRes.contentType}, Result: ${streamRes.pass ? 'PASS' : 'FAIL'}`);

  // Shutdown cleanly
  console.log('\n[STEP 3] Shutting down backend server cleanly...');
  serverProc.kill('SIGINT');
  await wait(1500);

  console.log('\n============================================================');
  console.log('                 ENDPOINTS AUDIT SUMMARY                    ');
  console.log('============================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.method} ${r.endpoint} -> Status ${r.status}`);
    if (!r.pass) allPass = false;
  }
  console.log('============================================================');
  console.log(`OVERALL ENDPOINT AUDIT RESULT: ${allPass ? 'ALL PASS' : 'FAILURES DETECTED'}`);
  console.log('============================================================');

  if (!allPass) process.exit(1);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
