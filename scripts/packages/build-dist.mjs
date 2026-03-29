#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, readdir, copyFile, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const packageDir = process.cwd();
const srcDir = path.join(packageDir, 'src');
const distDir = path.join(packageDir, 'dist');
const packageJsonPath = path.join(packageDir, 'package.json');
const tsconfigPath = path.join(packageDir, 'tsconfig.json');
const tempTsconfigPath = path.join(packageDir, '.tsconfig.build-dist.tmp.json');
const tempTsbuildInfoPath = path.join(packageDir, '.tsconfig.build-dist.tmp.tsbuildinfo');
const assetSuffixes = ['.css', '.vm.js'];

function isAssetFile(filename) {
  return assetSuffixes.some((suffix) => filename.endsWith(suffix));
}

async function walkAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkAssets(fullPath)));
      continue;
    }
    if (entry.isFile() && isAssetFile(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function rewritePathTarget(target) {
  if (target.endsWith('/src/index.ts')) {
    return target.replace(/\/src\/index\.ts$/, '/dist/index.d.ts');
  }
  if (target.endsWith('/src/*')) {
    return target.replace(/\/src\/\*$/, '/dist/*');
  }
  if (target.endsWith('/src')) {
    return target.replace(/\/src$/, '/dist/index.d.ts');
  }
  return target;
}

async function writeBuildTsconfig() {
  const [packageJsonRaw, tsconfigRaw] = await Promise.all([
    readFile(packageJsonPath, 'utf8'),
    readFile(tsconfigPath, 'utf8'),
  ]);

  const packageJson = JSON.parse(packageJsonRaw);
  const tsconfig = JSON.parse(tsconfigRaw);
  const packageName = String(packageJson.name ?? '').trim();
  const currentPaths = tsconfig.compilerOptions?.paths ?? {};
  const rewrittenPaths = {};

  for (const [key, values] of Object.entries(currentPaths)) {
    if (!Array.isArray(values)) {
      rewrittenPaths[key] = values;
      continue;
    }

    const isSelfAlias =
      key === packageName ||
      key === `${packageName}/*`;

    rewrittenPaths[key] = isSelfAlias
      ? values
      : values.map((value) => (typeof value === 'string' ? rewritePathTarget(value) : value));
  }

  const buildTsconfig = {
    ...tsconfig,
    references: undefined,
    compilerOptions: {
      ...(tsconfig.compilerOptions ?? {}),
      declarationMap: false,
      sourceMap: false,
      tsBuildInfoFile: tempTsbuildInfoPath,
      paths: rewrittenPaths,
    },
  };

  await writeFile(tempTsconfigPath, `${JSON.stringify(buildTsconfig, null, 2)}\n`, 'utf8');
}

function runTscBuild() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['exec', '--', 'tsc', '-p', tempTsconfigPath], {
    cwd: packageDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function copyAssets() {
  const assets = await walkAssets(srcDir);
  for (const sourcePath of assets) {
    const relativePath = path.relative(srcDir, sourcePath);
    const targetPath = path.join(distDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
  return assets.length;
}

await rm(distDir, { recursive: true, force: true });
await rm(tempTsconfigPath, { force: true });
await rm(tempTsbuildInfoPath, { force: true });
await writeBuildTsconfig();
runTscBuild();
const copiedCount = await copyAssets();
await rm(tempTsconfigPath, { force: true });
await rm(tempTsbuildInfoPath, { force: true });
console.log(`Copied ${copiedCount} asset file(s) into ${path.relative(packageDir, distDir) || 'dist'}.`);
