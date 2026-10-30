import { execSync } from 'child_process';
import fs from 'fs';

const dir = 'C:/Users/bagul/Downloads';
const zips = fs.readdirSync(dir).filter(f => f.startsWith('ch2_tmc_') && f.endsWith('.zip'));

for (const z of zips) {
  try {
    const zipPath = `${dir}/${z}`;
    const out = execSync(`tar -tvf "${zipPath}"`, { encoding: 'utf8' });
    const imgLine = out.split('\n').find(l => l.includes('.img'));
    if (imgLine) {
      console.log(z, '-->', imgLine.trim());
    }
  } catch (e) {
    console.error('Error on', z, e.message);
  }
}
