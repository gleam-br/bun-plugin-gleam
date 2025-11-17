/**
 *
 * Gleam plugin util functions
 *
 */

import {
  join,
  resolve,
  dirname,
  relative,
} from "node:path";

import {
  type GleamProject,
  projectBuild,
  projectConfig,
  replaceId,
  isGleam,
} from "./project";

/**
 * Resolve the identification file/path gleam to mjs.
 *
 * @param project Gleam project info.
 * @param source Path to source imported by
 * @param importer Path to importer of source
 * @returns Resolved identification gleam to mjs file.
 */
export async function resolveId(
  project: GleamProject,
  source: string,
  importer: string | undefined,
): Promise<{ path: string } | undefined> {
  const { log, dir: { out } } = project

  if (!importer) {
    log(`[resolve] skip: importer is empty`)
    log(`:> skip source ${source}`)
    return;
  } else if (source.startsWith("hex:")) {
    // resolve prefix `"hex:"`
    const id = resolveHex(project, source)
    return { path: id };
  }

  // normalize relative path
  const normalized = await normalize(project, importer, source);

  if (!normalized) {
    // skipping nothing to do
    return;
  }

  const { name } = await projectConfig(project);
  log(`:>[resolve] name ${name}`);
  // relative path to gleam build dir
  const path = join(out, name, normalized);

  log(`[resolve] ok!`);
  log(`:>[resolve] ${path}`);
  return { path };
}

/**
 * Gleam project build files.
 *
 * @param project Gleam project.
 * @see GleamProject
 */
export async function build(project: GleamProject): Promise<void> {
  const { log, build: { force } } = project;

  if (force) {
    await projectBuild(project);
  } else {
    log(`:> build.force = false`);
  }
}

// PRIVATE
//

// Resolve prefix 'hex:'
//
function resolveHex(project: GleamProject, source: string): string {
  const { log, dir: { out } } = project;
  const mod = replaceId(source.slice(4));

  if (!mod) {
    const error = `Empty module 'hex:'`;

    log(error, true);
    throw new Error(error);
  }

  const id = join(out, mod);

  log(`[resolve-hex] ok!`);
  log(`:>[resolve-hex] mod: ${mod}`)
  log(`:>[resolve-hex] path: ${id}`)
  return id;
}

// Normalize relative path
//
async function normalize(
  project: GleamProject,
  importer: string,
  source = ""
): Promise<string | undefined> {
  const { log, dir: { cwd, out, src } } = project;

  // early skipping
  if (!isGleam(source)) {
    log(`[normalize] skip: not gleam file`)
    log(`:> skip source ${source}`)
    log(`:> skip importer ${importer}`)
    return;
  }

  const absolutePath = resolve(dirname(importer), source);
  log(`:> ${absolutePath}`);
  const relativePath = relative(src, absolutePath);
  log(`:> ${relativePath}`);
  const replacedId = replaceId(relativePath);

  return successLog(log, replacedId, importer, source);
}

// Log success normalize importer and source.
//
function successLog(
  log: any, path: string,
  importer: string,
  source: string
): string {
  log(`[normalize] ok!`);
  log(`:>[normalize] ${path}`);
  log(`:>[normalize] source: ${source}`);
  log(`:>[normalize] importer: ${importer}`);

  return path;
}
