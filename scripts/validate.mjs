import fs from 'node:fs';
import path from 'node:path';
import { parseFile, slugify, validateLinks } from './schema.mjs';

const linkCheck = process.argv.includes('--links');
const requested = process.argv.slice(2).filter((argument) => argument !== '--links');
const directory = path.resolve('phantoms');
const files = requested.length
  ? requested
  : fs.readdirSync(directory)
      .filter((filename) => filename.endsWith('.md') && !filename.startsWith('_'))
      .map((filename) => path.join(directory, filename));

const titles = new Map();
for (const filename of files) {
  const phantom = parseFile(filename);
  const slug = path.basename(filename, '.md');
  const expectedSlug = slugify(phantom.data.title);
  if (slug !== expectedSlug) {
    throw new Error(`${filename}: filename must be ${expectedSlug}.md`);
  }

  const normalizedTitle = phantom.data.title.trim().toLowerCase();
  if (titles.has(normalizedTitle)) {
    throw new Error(`${filename}: duplicate title also used by ${titles.get(normalizedTitle)}`);
  }
  titles.set(normalizedTitle, filename);

  if (linkCheck) await validateLinks(phantom.data);
}

console.log(`Validated ${files.length} phantom entr${files.length === 1 ? 'y' : 'ies'}${linkCheck ? ' and external links' : ''}.`);
