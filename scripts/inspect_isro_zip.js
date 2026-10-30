import { execSync } from 'child_process';
import fs from 'fs';

console.log('Inspecting downloaded ISRO zips...');
const zip = 'C:\\Users\\bagul\\Downloads\\ch2_tmc_ncn_20260823T1657513854_d_img_d18.zip';
try {
  const list = execSync(`tar -tvf "${zip}"`, { encoding: 'utf8' });
  const relevant = list.split('\n').filter(l => l.includes('.img') || l.includes('.xml'));
  console.log(relevant.join('\n'));
} catch (e) {
  console.error(e.message);
}
