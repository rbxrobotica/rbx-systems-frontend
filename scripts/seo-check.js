#!/usr/bin/env node
/**
 * Lightweight static SEO check for rbx-robotica-frontend.
 * Validates that public pages carry SEO metadata and that robots/sitemap exist.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ROUTES_DIR = join(ROOT, 'src', 'routes');

const REQUIRED_DYNAMIC_ENDPOINTS = [
  join(ROOT, 'src', 'routes', 'robots.txt', '+server.ts'),
  join(ROOT, 'src', 'routes', 'sitemap.xml', '+server.ts')
];
const EXCLUDED_ROUTES = ['api', 'healthz', '[slug]', '+layout', '+error'];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith('+page.svelte')) {
      files.push(full);
    }
  }
  return files;
}

function isExcluded(relativePath) {
  return EXCLUDED_ROUTES.some((ex) => relativePath.includes(ex));
}

let errors = 0;

// 1. Dynamic robots.txt and sitemap.xml endpoints
for (const endpoint of REQUIRED_DYNAMIC_ENDPOINTS) {
  const name = endpoint.replace(ROOT, '').replace(/^\//, '');
  try {
    statSync(endpoint);
    console.log(`✓ ${name} exists`);
  } catch {
    console.error(`✗ ${name} is missing`);
    errors++;
  }
}

// 2. Pages must reference Seo component or have title/description
const pages = walk(ROUTES_DIR).filter((p) => !isExcluded(p.replace(ROUTES_DIR, '')));

for (const page of pages) {
  const source = readFileSync(page, 'utf-8');
  const relative = page.replace(ROUTES_DIR, '');

  const hasSeo =
    (source.includes('Seo') && source.includes('$components/Seo')) ||
    source.includes('ContentPage') ||
    source.includes('TeamPage');
  const hasTitle =
    source.includes('<title>') ||
    source.includes('metaTitle') ||
    source.includes('fallbackTitle') ||
    source.includes('TeamPage');
  const hasDescription =
    source.includes('metaDescription') ||
    source.includes('name="description"') ||
    source.includes('fallbackLead') ||
    source.includes('TeamPage');

  if (!hasSeo) {
    console.error(`✗ ${relative}: does not use Seo component`);
    errors++;
  }
  if (!hasTitle) {
    console.error(`✗ ${relative}: missing title`);
    errors++;
  }
  if (!hasDescription) {
    console.error(`✗ ${relative}: missing description`);
    errors++;
  }
  if (hasSeo && hasTitle && hasDescription) {
    console.log(`✓ ${relative}`);
  }
}

if (errors > 0) {
  console.error(`\n${errors} SEO issue(s) found.`);
  process.exit(1);
}

console.log('\nAll SEO checks passed.');
