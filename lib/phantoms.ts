import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export type Phantom = {
  slug: string;
  title: string;
  description: string;
  image: string;
  zenodo: string;
  paper?: string;
  size_bytes: number;
  tested_on: Record<string, string>;
  tags: string[];
  submitted_by: string;
};

const phantomDirectory = path.join(process.cwd(), 'phantoms');

function frontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u);
  if (!match) throw new Error('Phantom entry is missing YAML frontmatter');
  return { data: parse(match[1]), content: match[2] };
}

export function getPhantoms(): Phantom[] {
  if (!fs.existsSync(phantomDirectory)) return [];

  return fs
    .readdirSync(phantomDirectory)
    .filter((filename) => filename.endsWith('.md') && !filename.startsWith('_'))
    .map((filename) => {
      const source = fs.readFileSync(path.join(phantomDirectory, filename), 'utf8');
      const { data, content } = frontmatter(source);

      return {
        slug: filename.replace(/\.md$/, ''),
        title: data.title,
        description: content.trim(),
        image: data.image,
        zenodo: data.zenodo,
        paper: data.paper || undefined,
        size_bytes: data.size_bytes,
        tested_on: data.tested_on ?? {},
        tags: data.tags ?? [],
        submitted_by: data.submitted_by,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
