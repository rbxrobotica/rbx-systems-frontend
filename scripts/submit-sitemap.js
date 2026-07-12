#!/usr/bin/env node
/**
 * Submit the sitemap to Google Search Console.
 *
 * Requires a service-account key with "Owner" or "Restricted Owner" role on
 * the Search Console property. The key file is provided via
 * GOOGLE_SEARCH_CONSOLE_KEY_PATH; the site URL via SITE_URL.
 *
 * Usage:
 *   GOOGLE_SEARCH_CONSOLE_KEY_PATH=/path/to/key.json \
 *   SITE_URL=https://rbx.ia.br \
 *   node scripts/submit-sitemap.js
 */

import { google } from 'googleapis';
import { readFileSync } from 'node:fs';

const keyPath = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH;
const siteUrl = process.env.SITE_URL;

if (!keyPath || !siteUrl) {
  console.error('Missing GOOGLE_SEARCH_CONSOLE_KEY_PATH or SITE_URL');
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, 'utf-8'));
const sitemapUrl = `${siteUrl.replace(/\/$/, '')}/sitemap.xml`;

const jwt = new google.auth.JWT(
  key.client_email,
  undefined,
  key.private_key,
  ['https://www.googleapis.com/auth/webmasters'],
  undefined
);

const webmasters = google.webmasters({ version: 'v3', auth: jwt });

try {
  await webmasters.sitemaps.submit({ feedpath: sitemapUrl, siteUrl });
  console.log(`Submitted ${sitemapUrl} for ${siteUrl}`);
} catch (err) {
  console.error('Failed to submit sitemap:', err);
  process.exit(1);
}
