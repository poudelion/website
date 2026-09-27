import {cpSync, mkdirSync} from 'node:fs';
mkdirSync('docs',{recursive:true});
cpSync('out','docs',{recursive:true});
console.log('Static site ready in docs/ for adityapoudel.live');
