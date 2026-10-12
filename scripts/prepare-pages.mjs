import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
// docs is generated deployment output; public is the editable source.
rmSync('docs', { recursive: true, force: true });
mkdirSync('docs', { recursive: true });
cpSync('public', 'docs', { recursive: true });
writeFileSync('docs/.nojekyll', '');
console.log('Portfolio built in docs/ for GitHub Pages.');
