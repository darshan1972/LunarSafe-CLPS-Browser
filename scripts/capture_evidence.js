import { execSync } from 'child_process';
import fs from 'fs';

const e1 = execSync('powershell -NoProfile -Command "Get-ChildItem -Path C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission -Recurse | Select-Object FullName, Length | Format-Table -AutoSize"').toString();
fs.writeFileSync('scratch_e1.txt', e1);

const e8 = execSync('powershell -NoProfile -Command "Get-ChildItem -Path C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission -Recurse -File | Select-Object Name, Length | Format-Table -AutoSize"').toString();
fs.writeFileSync('scratch_e8.txt', e8);

console.log('Saved scratch_e1.txt and scratch_e8.txt');
