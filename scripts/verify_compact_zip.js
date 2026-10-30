import { execSync } from 'child_process';
import fs from 'fs';

const zip = 'C:/Users/bagul/Desktop/LunarSafe_FrozenEngine_Verification.zip';
const list = execSync(`tar -tvf "${zip}"`, { encoding: 'utf8' }).trim().split('\n');

console.log('Total entries in zip:', list.length);

const imgProc = list.filter(l => l.includes('imageProcessor.ts'));
console.log('imageProcessor.ts entries:');
imgProc.forEach(l => console.log('  ', l.trim()));

const forbidden = list.filter(l => l.includes('.img') || l.includes('node_modules') || l.includes('.pdf'));
console.log('Forbidden entries (node_modules, .img, .pdf):', forbidden.length);
if (forbidden.length > 0) {
  forbidden.forEach(l => console.log('  VIOLATION:', l.trim()));
}
