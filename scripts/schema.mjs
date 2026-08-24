import fs from 'node:fs';
import { parse, stringify } from 'yaml';

export const packageNames = new Set([
  'KomaMRI',
  'KomaMRIBase',
  'KomaMRICore',
  'KomaMRIFiles',
  'KomaMRIPlots',
]);

export const wordCount = (value) => value.trim().split(/\s+/u).filter(Boolean).length;
export const slugify = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/gu, '')
  .toLowerCase()
  .replace(/œ/gu, 'oe')
  .replace(/æ/gu, 'ae')
  .replace(/[^a-z0-9]+/gu, '-')
  .replace(/^-|-$/gu, '')
  .slice(0, 72);

export function parseMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u);
  if (!match) throw new Error('Phantom entry is missing YAML frontmatter');
  return { data: parse(match[1]), content: match[2] };
}

export function stringifyMatter(data, content) {
  return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n${content.trim()}\n`;
}

function httpsUrl(value, field) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error();
    return url;
  } catch {
    throw new Error(`${field} must be a valid HTTPS URL`);
  }
}

export function validatePhantom({ data, content }, filename = 'phantom') {
  const errors = [];
  const fail = (message) => errors.push(`${filename}: ${message}`);

  if (!data.title?.trim()) fail('title is required');
  if (!data.image?.trim()) fail('image is required');
  if (!data.zenodo?.trim()) fail('zenodo is required');
  if (!data.submitted_by?.trim()) fail('submitted_by is required');
  if (!Number.isSafeInteger(data.size_bytes) || data.size_bytes < 1) fail('size_bytes must be a positive integer');

  const count = wordCount(content);
  if (count < 1 || count > 100) fail(`description must contain 1–100 words; found ${count}`);

  try {
    const url = httpsUrl(data.zenodo, 'zenodo');
    if (!(url.hostname === 'zenodo.org' || url.hostname.endsWith('.zenodo.org')) || !/^\/records\/\d+/u.test(url.pathname)) {
      fail('zenodo must link to a Zenodo record');
    }
  } catch (error) { fail(error.message); }

  try {
    const url = httpsUrl(data.image, 'image');
    if (!(url.hostname === 'zenodo.org' || url.hostname.endsWith('.zenodo.org'))) {
      fail('image must be hosted on Zenodo');
    }
  } catch (error) { fail(error.message); }

  if (data.paper) {
    try { httpsUrl(data.paper, 'paper'); } catch (error) { fail(error.message); }
  }

  if (!data.tested_on || typeof data.tested_on !== 'object' || Array.isArray(data.tested_on)) {
    fail('tested_on must be a package-to-version mapping');
  } else {
    if (!data.tested_on.KomaMRI) fail('tested_on.KomaMRI is required');
    for (const [name, version] of Object.entries(data.tested_on)) {
      if (!packageNames.has(name)) fail(`unknown KomaMRI package in tested_on: ${name}`);
      if (!/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(String(version))) {
        fail(`${name} must use an exact semantic version such as 0.9.4`);
      }
    }
  }

  if (!Array.isArray(data.tags)) {
    fail('tags must be a list');
  } else {
    if (data.tags.length > 8) fail('use at most 8 tags');
    if (new Set(data.tags).size !== data.tags.length) fail('tags must be unique');
    for (const tag of data.tags) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(String(tag))) {
        fail(`invalid tag "${tag}"; use lowercase words separated by hyphens`);
      }
    }
  }

  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/u.test(data.submitted_by ?? '')) {
    fail('submitted_by must be a GitHub username');
  }

  if (errors.length) throw new Error(errors.join('\n'));
  return { data, content: content.trim() };
}

export function parseFile(filename) {
  return validatePhantom(parseMatter(fs.readFileSync(filename, 'utf8')), filename);
}

function zenodoRecordId(value) {
  const url = httpsUrl(value, 'zenodo');
  const match = url.pathname.match(/^\/records\/(\d+)/u);
  if (!match) throw new Error('zenodo must link to a Zenodo record');
  return match[1];
}

export async function fetchPhantomSize(zenodo, fetcher = fetch) {
  const response = await fetcher(`https://zenodo.org/api/records/${zenodoRecordId(zenodo)}`, {
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KomaMRIPhantoms metadata fetcher',
    },
  });
  if (!response.ok) throw new Error(`zenodo returned HTTP ${response.status}`);

  const record = await response.json();
  const phantomFiles = (record.files ?? []).filter((file) =>
    String(file.key ?? file.filename ?? '').toLowerCase().endsWith('.phantom'));
  if (!phantomFiles.length) throw new Error('Zenodo record contains no .phantom file');

  const sizes = phantomFiles.map((file) => Number(file.size));
  if (sizes.some((size) => !Number.isSafeInteger(size) || size < 1)) {
    throw new Error('Zenodo returned an invalid .phantom file size');
  }
  return sizes.reduce((total, size) => total + size, 0);
}

async function checkUrl(value, label, expectImage = false, fetcher = fetch) {
  const response = await fetcher(value, {
    redirect: expectImage ? 'follow' : 'manual',
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'KomaMRIPhantoms link validator' },
  });
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
  if (expectImage && !response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
    throw new Error(`${label} did not return an image`);
  }
  await response.body?.cancel();
}

export async function validateLinks(data, fetcher = fetch) {
  const [size] = await Promise.all([
    fetchPhantomSize(data.zenodo, fetcher),
    checkUrl(data.image, 'image', true, fetcher),
    data.paper ? checkUrl(data.paper, 'paper', false, fetcher) : undefined,
  ]);
  if (size !== data.size_bytes) {
    throw new Error(`size_bytes is ${data.size_bytes}; Zenodo reports ${size}`);
  }
}
