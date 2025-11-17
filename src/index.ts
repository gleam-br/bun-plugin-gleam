/**
 * Gleam bun runtim e plugin to transpile gleam files.
 */

import { type BunPlugin, type PluginBuilder } from "bun";

import { PLUGIN_NAME, CONSTRAINTS } from "./util";

import { projectNew } from "./project";

import { build, resolveId } from "./plugin";

/**
 * A Bun plugin that resolves imports with `.gleam` extensions to their
 * compiled JavaScript counterparts in the build directory.
 *
 * @type {BunPlugin}
 */
export default function plugin(options: any | undefined): BunPlugin {
  const project = projectNew(options);

  return {
    name: PLUGIN_NAME,
    async setup(builder: PluginBuilder) {
      builder.onStart(async () => {
        // build .gleam files
        await build(project);
      });

      builder.onResolve(CONSTRAINTS, ({ path, importer }): any => {
        // .gleam file resolution
        return resolveId(project, path, importer);
      });
    },
  };
}
