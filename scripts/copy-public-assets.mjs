import { cpSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const publicDirectory = resolve('public');
const outputDirectory = resolve('dist');

if (!existsSync(publicDirectory)) {
  throw new Error(`Public assets directory not found: ${publicDirectory}`);
}

mkdirSync(outputDirectory, { recursive: true });
cpSync(publicDirectory, outputDirectory, { recursive: true, force: true });
copyFileSync(resolve(publicDirectory, 'landing/index.html'), resolve(outputDirectory, 'index.html'));
copyFileSync(resolve(publicDirectory, 'landing/gida.png'), resolve(outputDirectory, 'gida.png'));
