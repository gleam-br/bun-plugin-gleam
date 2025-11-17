/**
 * Gleam bun runtim e plugin to transpile gleam files.
 */

import {
  dirname,
  join,
  relative,
  resolve
} from "node:path";

import {
  type BunPlugin,
  type OnLoadCallback,
  type PluginBuilder,
} from "bun";

import {
  projectNew,
  projectBuild,
  isGleam,
  replaceId,
} from "./project";

import {
  PLUGIN_NAME,
  GLEAM_CONFIG,
  CONSTRAINTS,
} from "./util";
import { build, resolveId } from "./plugin";

/**
 * A Bun plugin that resolves imports with `.gleam` extensions to their
 * compiled JavaScript counterparts in the build directory.
 *
 * @type {BunPlugin}
 */
export default function plugin(options: any | undefined): BunPlugin {
  const project = projectNew(options);
  const { log, dir: { cwd, src, out }, build: { force } } = project;
  const cfg = join(cwd, GLEAM_CONFIG);

  return {
    name: PLUGIN_NAME,
    async setup(builder: PluginBuilder) {
      builder.onStart(async () => {

        await build(project);
      });

      builder.onResolve(CONSTRAINTS, ({ path, importer }) => {

        // .gleam file resolution
        return resolveId(project, path, importer);

      });
    },
  };
}
