/**
 * Gleam bun runtim e plugin to transpile gleam files.
 */

import * as Process from "node:process";
import * as Path from "node:path";
import * as Fs from "node:fs";

import { type BunPlugin, type OnLoadCallback, type PluginBuilder } from "bun"

import { projectBuild, projectNew, isGleamFile, CONSTRAINTS } from "core-plugin-gleam";

const PLUGIN_NAME: string = "bun-plugin-gleam";

/**
 * A Bun plugin that resolves imports with `.gleam` extensions to their
 * compiled JavaScript counterparts in the build directory.
 *
 * @type {BunPlugin}
 */
export default function plugin(options: any | undefined): BunPlugin {
  const project = projectNew(options);
  const build = projectBuild(project);
  const { cfg, dir: { src, out }, args: { bunup } } = project;

  return {
    name: PLUGIN_NAME,
    async setup(builder: PluginBuilder) {
      // Only socket is open to execSync with bunup runtime.
      builder.onStart(async () => {
        if (bunup) {
          await build();
        }
      });
      // Directories to build will be paths relative to the root of the Gleam project,
      // but that won't necessarily be the current working directory. This walks up from
      // the current working directory to find the root of the Gleam project by looking
      // for a `gleam.toml` file.
      //
      const { name } = await import(cfg);

      // Handle .gleam file resolution
      builder.onResolve(CONSTRAINTS, ({ path, importer }) => {
        // Only handle gleam file relative imports
        if (!isGleamFile(path) || (!path.startsWith("./") && !path.startsWith("../"))) {
          return;
        }

        // Calculate the absolute path of the imported .gleam file
        const absoluteGleamPath = Path.resolve(Path.dirname(importer), path);

        // Calculate the path relative to the root
        const relativeToSrc = Path.relative(
          src,
          absoluteGleamPath,
        );

        // Remove the .gleam extension
        const withoutExtension = relativeToSrc.replace(/\.gleam$/, "");

        // Build the path to the compiled JavaScript file
        const compiledPath = Path.join(
          out,
          name,
          `${withoutExtension}.mjs`,
        );

        return { path: compiledPath };
      });
    },
  };
}
