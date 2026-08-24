import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchPhantomSize, packageNames, parseMatter, slugify, stringifyMatter, validatePhantom } from './schema.mjs';

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

export async function createSubmission({ body, submittedBy, root = '.', fetcher = fetch }) {
  const zenodo = field(body, 'Zenodo record');
  const data = {
    title: field(body, 'Phantom title'),
    image: field(body, 'Preview image'),
    zenodo,
    ...(field(body, 'Paper or reference') ? { paper: field(body, 'Paper or reference') } : {}),
    size_bytes: await fetchPhantomSize(zenodo, fetcher),
    tested_on: parseVersions(field(body, 'Tested on')),
    tags: field(body, 'Tags').split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    submitted_by: submittedBy,
  };
  const content = field(body, 'Description');
  validatePhantom({ data, content }, 'submission');

  const slug = slugify(data.title);
  if (!slug) throw new Error('Could not create a filename from the title');
  const relativeFilename = path.join('phantoms', `${slug}.md`);
  const filename = path.join(root, relativeFilename);
  if (fs.existsSync(filename)) throw new Error(`A phantom named ${slug} already exists`);

  const directory = path.join(root, 'phantoms');
  for (const existing of fs.readdirSync(directory).filter((name) => name.endsWith('.md') && !name.startsWith('_'))) {
    const current = parseMatter(fs.readFileSync(path.join(directory, existing), 'utf8'));
    if (current.data.title?.trim().toLowerCase() === data.title.trim().toLowerCase()) {
      throw new Error(`A phantom titled "${data.title}" already exists`);
    }
  }

  fs.writeFileSync(filename, stringifyMatter(data, content));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `entry_path=${relativeFilename}\n`);
  console.log(`Created ${relativeFilename}`);
  return relativeFilename;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await createSubmission({
    body: process.env.ISSUE_BODY ?? '',
    submittedBy: process.env.ISSUE_USER ?? '',
  });
}
