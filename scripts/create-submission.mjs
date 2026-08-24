import fs from 'node:fs';
import path from 'node:path';
import { packageNames, parseMatter, slugify, stringifyMatter, validatePhantom } from './schema.mjs';

function field(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = body.match(new RegExp(`### ${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n+### |$)`, 'u'));
  const value = match?.[1]?.trim();
  return value && value !== '_No response_' && value !== 'Not provided' ? value : '';
}

function parseVersions(value) {
  return Object.fromEntries(value.split(/\r?\n/u).filter(Boolean).map((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`Invalid tested-on line: ${line}`);
    const name = line.slice(0, separator).trim();
    const version = line.slice(separator + 1).trim();
    if (!packageNames.has(name)) throw new Error(`Unknown KomaMRI package: ${name}`);
    return [name, version];
  }));
}

const body = process.env.ISSUE_BODY ?? '';
const submittedBy = process.env.ISSUE_USER ?? '';
const data = {
  title: field(body, 'Phantom title'),
  image: field(body, 'Preview image'),
  zenodo: field(body, 'Zenodo record'),
  ...(field(body, 'Paper or reference') ? { paper: field(body, 'Paper or reference') } : {}),
  tested_on: parseVersions(field(body, 'Tested on')),
  tags: field(body, 'Tags').split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  submitted_by: submittedBy,
};
const content = field(body, 'Description');
validatePhantom({ data, content }, 'submission');

const slug = slugify(data.title);
if (!slug) throw new Error('Could not create a filename from the title');
const filename = path.join('phantoms', `${slug}.md`);
if (fs.existsSync(filename)) throw new Error(`A phantom named ${slug} already exists`);

for (const existing of fs.readdirSync('phantoms').filter((name) => name.endsWith('.md') && !name.startsWith('_'))) {
  const current = parseMatter(fs.readFileSync(path.join('phantoms', existing), 'utf8'));
  if (current.data.title?.trim().toLowerCase() === data.title.trim().toLowerCase()) {
    throw new Error(`A phantom titled "${data.title}" already exists`);
  }
}

fs.writeFileSync(filename, stringifyMatter(data, content));
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `entry_path=${filename}\n`);
console.log(`Created ${filename}`);
