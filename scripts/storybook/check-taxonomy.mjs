#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(thisFile, '../../..');

const APP_PREFIXES = new Map([
  ['apps/inventory/', 'Apps/Inventory/'],
  ['apps/todo/', 'Apps/Todo/'],
  ['apps/crm/', 'Apps/Crm/'],
  ['apps/book-tracker-debug/', 'Apps/BookTrackerDebug/'],
]);

const FORBIDDEN_TOP_LEVEL = new Set([
  'Packages',
  'Widgets',
  'Shell',
  'Pages',
  'Chat',
  'Todo',
  'CRM',
  'BookTrackerDebug',
  'BookTracker',
  'Plugin Runtime',
]);

function walk(dir, out) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.stories\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
}

function inferExpectedPrefix(relPath) {
  if (relPath.startsWith('packages/engine/src/components/shell/')) {
    return 'Engine/Shell/';
  }
  if (relPath.startsWith('packages/engine/src/components/widgets/')) {
    return 'Engine/Widgets/';
  }
  if (relPath.startsWith('packages/engine/src/plugin-runtime/')) {
    return 'Engine/PluginRuntime/';
  }
  if (relPath.startsWith('packages/engine/')) {
    return 'Engine/';
  }
  for (const [pathPrefix, titlePrefix] of APP_PREFIXES.entries()) {
    if (relPath.startsWith(pathPrefix)) return titlePrefix;
  }
  return null;
}

function extractCanonicalTitle(source) {
  const matches = [...source.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  return matches.find((t) => t.startsWith('Apps/') || t.startsWith('Engine/')) ?? null;
}

function checkPlacement(relPath) {
  if (relPath.startsWith('apps/')) {
    if (relPath.includes('/src/stories/')) {
      return 'app story must not live in flat src/stories; move under src/app/stories or src/features/**/stories';
    }
    const ok = /^apps\/[^/]+\/src\/(app\/stories|features\/.+\/stories)\/[^/]+\.stories\.(ts|tsx)$/.test(relPath);
    if (!ok) {
      return 'app story path must match src/app/stories/* or src/features/**/stories/*';
    }
  }

  if (relPath.startsWith('packages/engine/')) {
    const ok = /^packages\/engine\/src\/(components\/.+|plugin-runtime\/.+)\.stories\.(ts|tsx)$/.test(relPath);
    if (!ok) {
      return 'engine story path must be under packages/engine/src/components or packages/engine/src/plugin-runtime';
    }
  }

  return null;
}

const storyFiles = [];
walk(join(repoRoot, 'apps'), storyFiles);
walk(join(repoRoot, 'packages/engine/src'), storyFiles);

const errors = [];

for (const file of storyFiles) {
  const relPath = relative(repoRoot, file).replace(/\\/g, '/');
  const source = readFileSync(file, 'utf8');

  const title = extractCanonicalTitle(source);
  if (!title) {
    errors.push(`${relPath}: missing canonical meta title (Apps/* or Engine/*)`);
    continue;
  }

  const expectedPrefix = inferExpectedPrefix(relPath);
  if (!expectedPrefix) {
    errors.push(`${relPath}: could not infer expected title prefix from path`);
  } else if (!title.startsWith(expectedPrefix)) {
    errors.push(`${relPath}: title/path mismatch (${title} vs expected prefix ${expectedPrefix})`);
  }

  const topLevel = title.split('/')[0];
  if (FORBIDDEN_TOP_LEVEL.has(topLevel)) {
    errors.push(`${relPath}: forbidden legacy top-level title segment (${topLevel})`);
  }
  if (title.startsWith('Engine/Components/')) {
    errors.push(`${relPath}: legacy engine taxonomy segment Engine/Components/* is not allowed`);
  }

  const placementError = checkPlacement(relPath);
  if (placementError) errors.push(`${relPath}: ${placementError}`);
}

if (errors.length > 0) {
  console.error('Storyboard taxonomy check failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Storyboard taxonomy check passed (${storyFiles.length} story files).`);
