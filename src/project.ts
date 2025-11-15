/**
 * Gleam js plugin project functions
 */

import { resolve } from "node:path";

import { cwd as process_cwd } from "node:process";
import { execSync } from "node:child_process";

import {
  GLEAM_BIN,
  GLEAM_SRC,
  GLEAM_BUILD,
  GLEAM_CONFIG,
  GLEAM_REGEX_FILE,
  GLEAM_REGEX_CONFIG,
  logger,
} from "./util";

/**
 * Gleam project info.
 */
export interface GleamProject {
  bin: string,
  // util.logger(level)
  log: any,
  dir: GleamDir,
  args: {
    build: GleamBuild,
  }
}

export interface GleamDir {
  cwd: string
  src: string
  out: string
}

/**
 * Gleam plugin options.
 */
export interface GleamPlugin {
  cwd: string;
  bin: string;
  log: {
    time: boolean,
    level: "info" | "debug" | "trace" | "none"
  }
  build: GleamBuild;
}

/**
 * Gleam build options.
 */
export interface GleamBuild {
  force: boolean;
  noPrintProgress: boolean;
  warningsAsErrors: boolean;
}

/**
 * Gleam build output.
 */
export interface GleamBuildOut {
  out: string
}

/** Gleam options default */
const GLEAM_OPT_EMPTY = {
  bin: GLEAM_BIN,
  log: { time: false, level: "none" },
  cwd: process_cwd(),
  build: {
    force: false,
    noPrintProgress: true,
    warningsAsErrors: false,
  }
} as GleamPlugin;

// PRIVATE
//

/**
 * Get options from any.
 *
 * @param options any object.
 * @returns Gleam plugin options object.
 */
function getPluginOpts(options: any | undefined): GleamPlugin {
  if (!options || typeof options !== "object") {
    return GLEAM_OPT_EMPTY;
  }
  const bin = options.bin
    ? options.bin
    : typeof options.build?.bin === "string"
      ? options.build?.bin
      : GLEAM_BIN;
  const cwd = options.cwd
    ? options.cwd
    : typeof options.build?.config === "string"
      ? options.build?.config
      : process_cwd();
  const level = typeof options.log === "string"
    ? options.log
    : typeof options.log?.level === "string"
      ? options.log?.level
      : "none";
  const time = options.time === true
    || options.log?.time === true;
  const warningsAsErrors = options.warningsAsErrors === true
    || options.build?.warningsAsErrors === true;
  const noPrintProgress = !(options.noPrintProgress === false
    || options.build?.noPrintProgress === false);
  const force = options.force === true
    || options.build?.force === true;

  return {
    cwd,
    log: { level, time },
    bin,
    build: {
      force,
      noPrintProgress,
      warningsAsErrors,
    }
  };
}

function endsWith(word: string, term: string): boolean {
  return word ? word.endsWith(term) : false;
}

/**
 * Get gleam project info from plugin options.
 *
 * @param options Gleam plugin options.
 * @returns Project info like gleam binary, directories and more.
 */
export function projectNew(options: any | undefined): GleamProject {
  const opts = getPluginOpts(options);
  const { cwd, bin, log: { level, time }, build: { force, noPrintProgress, warningsAsErrors } } = opts
  // Gleam expects a project to have `src/` directory at project root.
  const src = resolve(cwd, GLEAM_SRC);
  // Gleam compiler outputs artifacts under `build/` directory at project root.
  // Directory structure inside is not documentated, but this is the only way
  // to access built JS files. There is no way to specify output directory also.
  const out = resolve(cwd, GLEAM_BUILD);
  // log instance with level and has time prefix
  const log = logger(level, time)

  log(`$ STARTUP OK !`);
  log(`:> bin: '${bin}'`);
  log(`:> log.time: '${time}'`);
  log(`:> log.level: '${level}'`);
  log(`:> build.force: '${force}'`);
  log(`:> cwd: '${cwd}'`);

  return {
    bin,
    log,
    dir: {
      cwd,
      src,
      out,
    },
    args: {
      build: {
        force,
        noPrintProgress,
        warningsAsErrors
      }
    },
  };
}

/**
 * Gleam build to target javascript.
 *
 * @param bin Gleam binary location.
 * @param projectDirRoot Gleam project root location of gleam.toml.
 * @param noPrintProgress Gleam --no-print-progress build arg.
 * @param warningsAsErrors Gleam --warnings-as-errors build arg.
 *
 * @returns Promisify executing gleam build.
 */
export function projectBuild(project: GleamProject): GleamBuildOut {
  const {
    bin,
    log,
    dir: { cwd },
    args: {
      build: { noPrintProgress, warningsAsErrors }
    }
  } = project;

  const args = [bin, "build", "--target", "javascript"];

  if (warningsAsErrors) {
    args.push("--warnings-as-errors");
  }

  if (noPrintProgress) {
    args.push("--no-print-progress");
  }

  const cmd = args.join(" ");

  // Build command won't change during the plugin's lifetime.
  // It's fine to bind everything upfront.
  try {
    log(`$ ${cmd}`);
    const out = execSync(cmd, { cwd, encoding: "utf8" });

    if (out && out !== undefined && out !== "") {
      log(`:> stdout ${JSON.stringify(out)}`)
    }

    return { out } as GleamBuildOut;
  } catch (err) {
    log(`${JSON.stringify(err)}`, true);
    throw err;
  }
}

export function isGleam(file: string): boolean {
  return endsWith(file, ".gleam") || GLEAM_REGEX_FILE.test(file);
}
