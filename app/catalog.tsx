'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { Phantom } from '../lib/phantoms';

const repository = 'https://github.com/JuliaHealth/KomaMRIPhantoms';
const packageNames = [
  'KomaMRI',
  'KomaMRIBase',
  'KomaMRICore',
  'KomaMRIFiles',
  'KomaMRIPlots',
] as const;

type FormState = {
  title: string;
  description: string;
  image: string;
  zenodo: string;
  paper: string;
  tags: string;
  tested_on: Record<(typeof packageNames)[number], string>;
};

const initialForm: FormState = {
  title: '',
  description: '',
  image: '',
  zenodo: '',
  paper: '',
  tags: '',
  tested_on: {
    KomaMRI: '',
    KomaMRIBase: '',
    KomaMRICore: '',
    KomaMRIFiles: '',
    KomaMRIPlots: '',
  },
};

const words = (value: string) => value.trim().split(/\s+/u).filter(Boolean).length;
const tagsFrom = (value: string) =>
  [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
const isVersion = (value: string) => /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(value);
const formatBytes = (bytes: number) => {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(bytes >= 10_000_000_000 ? 1 : 2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 1 : 2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
};

function isUrl(value: string, host?: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!host || url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function PhantomCard({ phantom, preview = false }: { phantom: Phantom; preview?: boolean }) {
  const komaVersion = phantom.tested_on.KomaMRI || '—';

  return (
    <article className={`phantom-card${preview ? ' preview-card' : ''}`}>
      <div className="card-image">
        {phantom.image && isUrl(phantom.image) ? (
          // Preview images are intentionally hosted with the Zenodo record.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={phantom.image} alt={`Preview of ${phantom.title}`} />
        ) : (
          <div className="image-placeholder" aria-hidden="true"><span>K</span></div>
        )}
        {preview && <span className="preview-label">Live preview</span>}
      </div>

      <div className="card-body">
        <div className="card-heading">
          <h3>{phantom.title || 'Your phantom title'}</h3>
          <div className="card-facts">
            <details className="compatibility">
              <summary>Tested on KomaMRI {komaVersion}</summary>
              <div className="compatibility-details">
                <strong>Tested package versions</strong>
                <dl>
                  {Object.entries(phantom.tested_on).map(([name, version]) => (
                    <div key={name}><dt>{name}</dt><dd>{version}</dd></div>
                  ))}
                </dl>
              </div>
            </details>
            {phantom.size_bytes > 0 && <span>{formatBytes(phantom.size_bytes)}</span>}
          </div>
        </div>

        <p className="description">
          {phantom.description || 'A concise description of the phantom will appear here.'}
        </p>

        {phantom.tags.length > 0 && (
          <ul className="card-tags" aria-label="Tags">
            {phantom.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}

        <div className="card-links">
          <a className="primary-link" href={phantom.zenodo || '#submit'} target={preview ? undefined : '_blank'} rel="noreferrer">
            Download on Zenodo <span aria-hidden="true">↗</span>
          </a>
          {phantom.paper && (
            <a href={phantom.paper} target="_blank" rel="noreferrer">
              Paper <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="submitted-by">
          <span className="avatar" aria-hidden="true">
            {(phantom.submitted_by || 'you').slice(0, 1).toUpperCase()}
            {!preview && (
              // GitHub redirects this stable username URL to the current avatar.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://github.com/${phantom.submitted_by}.png?size=50`}
                alt=""
                onError={(event) => event.currentTarget.remove()}
              />
            )}
          </span>
          {preview ? (
            <span>Submitted by your GitHub account</span>
          ) : (
            <span>Submitted by <a href={`https://github.com/${phantom.submitted_by}`} target="_blank" rel="noreferrer">@{phantom.submitted_by}</a></span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Catalog({ phantoms }: { phantoms: Phantom[] }) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const allTags = useMemo(
    () => [...new Set(phantoms.flatMap((phantom) => phantom.tags))].sort(),
    [phantoms],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return phantoms.filter((phantom) => {
      const searchable = [phantom.title, phantom.description, phantom.submitted_by, ...phantom.tags]
        .join(' ')
        .toLowerCase();
      return (!needle || searchable.includes(needle))
        && selectedTags.every((tag) => phantom.tags.includes(tag));
    });
  }, [phantoms, query, selectedTags]);

  const formTags = tagsFrom(form.tags);
  const testedOn = Object.fromEntries(
    packageNames
      .map((name) => [name, form.tested_on[name].trim()])
      .filter(([, version]) => version),
  );
  const descriptionWords = words(form.description);
  const formErrors = {
    title: !form.title.trim(),
    description: descriptionWords === 0 || descriptionWords > 100,
    zenodo: !isUrl(form.zenodo, 'zenodo.org'),
    image: !isUrl(form.image, 'zenodo.org'),
    paper: Boolean(form.paper) && !isUrl(form.paper),
    versions: !isVersion(form.tested_on.KomaMRI)
      || Object.values(form.tested_on).some((version) => version && !isVersion(version)),
    tags: formTags.some((tag) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(tag)),
  };
  const validForm = !Object.values(formErrors).some(Boolean);

  const previewPhantom: Phantom = {
    slug: 'preview',
    title: form.title,
    description: form.description,
    image: form.image,
    zenodo: form.zenodo,
    paper: form.paper || undefined,
    size_bytes: 0,
    tested_on: testedOn,
    tags: formTags,
    submitted_by: 'you',
  };

  function update(field: Exclude<keyof FormState, 'tested_on'>, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!validForm) return;

    const params = new URLSearchParams({
      template: 'phantom-submission.yml',
      title: `[Phantom submission] ${form.title.trim()}`,
      phantom_title: form.title.trim(),
      description: form.description.trim(),
      zenodo: form.zenodo.trim(),
      image: form.image.trim(),
      paper: form.paper.trim() || 'Not provided',
      tested_on: Object.entries(testedOn).map(([name, version]) => `${name}: ${version}`).join('\n'),
      tags: formTags.join(', '),
    });

    window.location.assign(`${repository}/issues/new?${params.toString()}`);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="KomaMRI Phantom Library home">
          <span className="brand-mark" aria-hidden="true">K</span>
          <span>KomaMRI <strong>Phantoms</strong></span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="github-link" href={repository} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true">
              <path fill="currentColor" d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.64 5.47 7.72.4.08.55-.18.55-.39 0-.19-.01-.83-.01-1.51-2.01.38-2.53-.5-2.69-.96-.09-.23-.48-.96-.82-1.15-.28-.15-.68-.53-.01-.54.63-.01 1.08.59 1.23.83.72 1.23 1.87.88 2.33.67.07-.53.28-.88.51-1.08-1.78-.2-3.64-.9-3.64-4.02 0-.89.31-1.62.82-2.19-.08-.2-.36-1.04.08-2.16 0 0 .67-.22 2.2.84A7.5 7.5 0 0 1 8 3.92a7.5 7.5 0 0 1 2 .27c1.53-1.06 2.2-.84 2.2-.84.44 1.12.16 1.96.08 2.16.51.57.82 1.3.82 2.19 0 3.13-1.87 3.82-3.65 4.02.29.25.54.74.54 1.5 0 1.08-.01 1.95-.01 2.22 0 .21.15.47.55.39A8.14 8.14 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z" />
            </svg>
            GitHub
          </a>
          <a className="nav-submit" href="#submit">Submit a phantom</a>
        </nav>
      </header>

      <section className="catalog-section" id="top">
        <div className="catalog-heading">
          <div><h1>Phantom catalog</h1></div>
          <div>
            <p>Community-contributed phantoms tested with KomaMRI and archived on Zenodo.</p>
            <span>{phantoms.length} {phantoms.length === 1 ? 'phantom' : 'phantoms'}</span>
          </div>
        </div>

        <div className="filter-panel">
          <label className="search-field">
            <span className="sr-only">Search phantoms</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by title, description, tag, or submitter"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {allTags.length > 0 && (
            <div className="tag-filters" aria-label="Filter by tags">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={selectedTags.includes(tag) ? 'selected' : ''}
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
              {(selectedTags.length > 0 || query) && (
                <button className="clear-filter" type="button" onClick={() => { setSelectedTags([]); setQuery(''); }}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="card-grid">
            {filtered.map((phantom) => <PhantomCard key={phantom.slug} phantom={phantom} />)}
          </div>
        ) : phantoms.length > 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>No matching phantoms</h3>
            <p>Try a broader search or clear the selected tags.</p>
            <button type="button" onClick={() => { setSelectedTags([]); setQuery(''); }}>Clear filters</button>
          </div>
        ) : (
          <div className="empty-state first-entry">
            <span aria-hidden="true">K</span>
            <h3>The library is ready for its first phantom</h3>
            <p>Zenodo keeps the large files. This catalog keeps only discoverable metadata.</p>
            <a className="button primary" href="#submit">Submit the first phantom</a>
          </div>
        )}
      </section>

      <section className="submit-section" id="submit">
        <div className="submit-intro">
          <p className="eyebrow">Contribute</p>
          <h2>Add a phantom without touching code</h2>
          <p>
            Fill in the form and preview the card here. GitHub will open with the same fields already filled; after one confirmation, an automated one-file pull request is created for review.
          </p>
          <ol>
            <li><span>1</span>Archive the phantom and preview image on Zenodo.</li>
            <li><span>2</span>Complete and preview this metadata form.</li>
            <li><span>3</span>Confirm the prefilled submission on GitHub.</li>
          </ol>
          <PhantomCard phantom={previewPhantom} preview />
        </div>

        <form className="submission-form" onSubmit={submit} noValidate>
          <div className="form-heading">
            <h3>Phantom metadata</h3>
            <span>All large files stay on Zenodo</span>
          </div>

          <label>
            <span>Title <b>Required</b></span>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Cardiac Motion Phantom" />
            {submitted && formErrors.title && <small className="error">Enter a title.</small>}
          </label>

          <label>
            <span>Description <b>Required</b><em>{descriptionWords}/100 words</em></span>
            <textarea rows={5} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What does this phantom represent, and what makes it useful?" />
            {submitted && formErrors.description && <small className="error">Use between 1 and 100 words.</small>}
          </label>

          <div className="field-pair">
            <label>
              <span>Zenodo record <b>Required</b></span>
              <input type="url" value={form.zenodo} onChange={(event) => update('zenodo', event.target.value)} placeholder="https://zenodo.org/records/…" />
              {submitted && formErrors.zenodo && <small className="error">Enter an HTTPS Zenodo URL.</small>}
            </label>
            <label>
              <span>Preview image <b>Required</b></span>
              <input type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://zenodo.org/records/…/preview.webp" />
              {submitted && formErrors.image && <small className="error">Use an image URL from Zenodo.</small>}
            </label>
          </div>

          <label>
            <span>Paper or reference <i>Optional</i></span>
            <input type="url" value={form.paper} onChange={(event) => update('paper', event.target.value)} placeholder="https://doi.org/…" />
            {submitted && formErrors.paper && <small className="error">Enter a valid HTTPS URL.</small>}
          </label>

          <fieldset>
            <legend>Tested on <b>Exact versions</b></legend>
            <p>Enter KomaMRI and every subpackage used to create or load the phantom.</p>
            <div className="version-grid">
              <label>
                <span>KomaMRI</span>
                <input
                  aria-required="true"
                  value={form.tested_on.KomaMRI}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    tested_on: { ...current.tested_on, KomaMRI: event.target.value },
                  }))}
                  placeholder="0.9.4"
                />
              </label>
              <div className="subpackage-grid">
                {packageNames.slice(1).map((name) => (
                  <label key={name}>
                    <span>{name}</span>
                    <input
                      value={form.tested_on[name]}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        tested_on: { ...current.tested_on, [name]: event.target.value },
                      }))}
                      placeholder="0.9.4"
                    />
                  </label>
                ))}
              </div>
            </div>
            {submitted && formErrors.versions && <small className="error">Use exact versions such as 0.9.4; KomaMRI is required.</small>}
          </fieldset>

          <label>
            <span>Tags <i>Optional</i></span>
            <input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="cardiac, motion, 3d" />
            <small>Comma-separated, lowercase words. Existing and new tags become catalog filters automatically.</small>
            {submitted && formErrors.tags && <small className="error">Use lowercase tags such as motion or parameter-map.</small>}
          </label>

          <div className="submit-note">
            <span aria-hidden="true">✓</span>
            <p><strong>Attribution is automatic.</strong> Your GitHub username will be recorded as the submitter.</p>
          </div>

          <button className="button primary submit-button" type="submit">
            Continue to GitHub <span aria-hidden="true">→</span>
          </button>
          <p className="form-footnote">You will review the prefilled submission before anything is created.</p>
        </form>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">K</span><span>KomaMRI <strong>Phantoms</strong></span></a>
        <p>Open phantom metadata. Large files remain permanently archived on Zenodo.</p>
        <a href={repository} target="_blank" rel="noreferrer">View on GitHub ↗</a>
      </footer>
    </main>
  );
}
