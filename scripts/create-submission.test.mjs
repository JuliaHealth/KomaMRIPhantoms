import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
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

test('converts an issue form into one attributed metadata file', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'komamri-phantom-'));
  fs.mkdirSync(path.join(directory, 'phantoms'));
  const result = spawnSync(process.execPath, [path.resolve('scripts/create-submission.mjs')], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, ISSUE_BODY: issueBody, ISSUE_USER: 'octocat' },
  });

  assert.equal(result.status, 0, result.stderr);
  const filename = path.join(directory, 'phantoms', 'cardiac-motion-phantom.md');
  assert.equal(fs.existsSync(filename), true);
  const phantom = parseMatter(fs.readFileSync(filename, 'utf8'));
  assert.equal(phantom.data.submitted_by, 'octocat');
  assert.deepEqual(phantom.data.tags, ['cardiac', 'motion']);
  assert.deepEqual(phantom.data.tested_on, { KomaMRI: '0.9.4', KomaMRICore: '0.9.4' });

  fs.rmSync(directory, { recursive: true });
});
