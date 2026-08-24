import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify, validatePhantom, wordCount } from './schema.mjs';

const valid = {
  data: {
    title: 'Cardiac Motion Phantom',
    image: 'https://zenodo.org/records/123/files/preview.webp',
    zenodo: 'https://zenodo.org/records/123',
    tested_on: { KomaMRI: '0.9.4', KomaMRICore: '0.9.4' },
    tags: ['cardiac', 'motion'],
    submitted_by: 'octocat',
  },
  content: 'A compact phantom for testing cardiac motion.',
};

test('counts words and creates stable slugs', () => {
  assert.equal(wordCount(' one  two\nthree '), 3);
  assert.equal(slugify('Cœur / Motion Phantom'), 'coeur-motion-phantom');
});

test('accepts complete phantom metadata', () => {
  assert.doesNotThrow(() => validatePhantom(valid));
});

test('rejects long descriptions and imprecise versions', () => {
  assert.throws(() => validatePhantom({
    data: { ...valid.data, tested_on: { KomaMRI: '0.9' } },
    content: Array.from({ length: 101 }, () => 'word').join(' '),
  }), /1–100 words.*exact semantic version/su);
});
