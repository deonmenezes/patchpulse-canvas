import { cp, mkdir, rm } from 'node:fs/promises';

const files = ['index.html', 'styles.css', 'app.js', 'favicon.svg'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
await Promise.all(files.map((file) => cp(file, `dist/${file}`)));
await cp('src/planner.js', 'dist/src/planner.js');

console.log(`Built ${files.length + 1} files into dist/`);
