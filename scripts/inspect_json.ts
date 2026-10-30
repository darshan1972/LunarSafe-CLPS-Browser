import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/assets/isro_data/full_analysis_results.json', 'utf8'));
console.log('Total tiles in json:', data.tiles.length);
console.log('Summary:', JSON.stringify(data.summary, null, 2));

const t88 = data.tiles.find((t: any) => t.col === 1 && t.row === 88);
console.log('Tile (1, 88):', t88);

