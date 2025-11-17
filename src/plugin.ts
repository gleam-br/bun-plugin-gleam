/**
 *
 * Gleam plugin util functions
 *
 */

import {
  dirname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  isGleam,
  projectBuild,
  replaceId,
  type GleamBuildOut,
  type GleamProject
} from "./project";
import { GLEAM_BUILD, GLEAM_CONFIG, GLEAM_SRC } from "./util";

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
  const { log, dir: { cwd } } = project

  if (!importer) {

    log(`[resolve] skip: importer is empty`)
    log(`:> skip source ${source}`)
    return;

  }

  if (source.startsWith("hex:")) {

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

  // relative path to gleam build dir
  const id = join(cwd, GLEAM_BUILD, normalized, "..", source);

  log(`[resolve] ok!`);
  log(`:>[resolve] normalized: ${normalized}`);
  log(`:>[resolve] id: ${id}`);
  return { path: id };

  // // Calculate the absolute path of the imported .gleam file
  // const absoluteGleamPath = resolve(dirname(importer), path);

  // // Calculate the path relative to the root
  // const relativeToSrc = relative(src, absoluteGleamPath);

  // // Remove the .gleam extension
  // const replacedId = replaceId(relativeToSrc)
  // const withoutExtension = relativeToSrc.replace(/\.gleam$/, "");

  // // Build the path to the compiled JavaScript file
  // const compiledPath = join(
  //   out,
  //   name,
  //   `${withoutExtension}.mjs`,
  // );

  // return { path: compiledPath };
}


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
  const { log, dir: { cwd, src } } = project;

  // early skipping
  if (!isGleam(source)) {
    log(`[resolve] skip: not gleam file`)
    log(`:> skip source ${source}`)
    log(`:> skip importer ${importer}`)
    return;
  }

  // replace identification
  const replaced = replaceId(importer);

  if (!replaced) {
    // skipping nothing to do
    return;
  }

  let path = relative(cwd, replaced);
  log(`:>[normalize] relative cwd ${path}`);
  // relative to cwd
  const cfg = join(cwd, GLEAM_CONFIG);
  // reload name from gleam.toml
  const { name } = await import(cfg);
  log(`:>[normalize] gleam project ${name}`);

  if (path.startsWith(GLEAM_SRC)) {
    path = path.replace(`${GLEAM_SRC}${sep}`, `${name}${sep}`);
    log(`:>[normalize] found 'src' replace to '${name}${sep}'`);
  }

  log(`[normalize] ok!`);
  log(`:>[normalize] ${path}`);
  log(`:>[normalize] source: ${source}`);
  log(`:>[normalize] importer: ${importer}`);
  return path;
}
