import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createSubmission } from './create-submission.mjs';
import { parseMatter } from './schema.mjs';

const issueBody = `### Phantom title

Cardiac Motion Phantom

### Description

A compact phantom for testing cardiac motion.

### Zenodo record

https://zenodo.org/records/123

### Preview image

https://zenodo.org/records/123/files/preview.webp

### Paper or reference

_No response_

### Tested on

KomaMRI: 0.9.4
KomaMRICore: 0.9.4

### Tags

cardiac, motion`;

test('converts an issue form into one attributed metadata file', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'komamri-phantom-'));
  fs.mkdirSync(path.join(directory, 'phantoms'));
  await createSubmission({
    body: issueBody,
    submittedBy: 'octocat',
    root: directory,
    fetcher: async () => new Response(JSON.stringify({
      files: [
        { key: 'cardiac.phantom', size: 1_500_000_000 },
        { key: 'preview.webp', size: 120_000 },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });

  const filename = path.join(directory, 'phantoms', 'cardiac-motion-phantom.md');
  assert.equal(fs.existsSync(filename), true);
  const phantom = parseMatter(fs.readFileSync(filename, 'utf8'));
  assert.equal(phantom.data.submitted_by, 'octocat');
  assert.equal(phantom.data.size_bytes, 1_500_000_000);
  assert.deepEqual(phantom.data.tags, ['cardiac', 'motion']);
  assert.deepEqual(phantom.data.tested_on, { KomaMRI: '0.9.4', KomaMRICore: '0.9.4' });

  fs.rmSync(directory, { recursive: true });
});
