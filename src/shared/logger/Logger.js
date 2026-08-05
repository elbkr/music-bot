import moment from "moment";
import chalk from "chalk";
import util from "util";

/**
 * Process-wide console logger. All output goes through `write()`, which timestamps,
 * tags, and colorizes every line before writing to stdout (or stderr for errors).
 */
export default class Logger {
  /**
   * @param {unknown} content - String or arbitrary value (formatted via `clean()`).
   * @param {object} [options]
   * @param {import("chalk").Color} [options.color] - Defaults to `"blue"`.
   * @param {string} [options.tag] - Bracketed label prefixing the line. Defaults to `"Log"`.
   * @returns {void}
   */
  static log(content, { color = "blue", tag = "Log" } = {}) {
    this.write(content, { color, tag });
  }

  /**
   * @param {unknown} content
   * @param {object} [options]
   * @param {import("chalk").Color} [options.color] - Defaults to `"yellow"`.
   * @param {string} [options.tag] - Defaults to `"Warn"`.
   * @returns {void}
   */
  static warn(content, { color = "yellow", tag = "Warn" } = {}) {
    this.write(content, { color, tag });
  }

  /**
   * @param {unknown} content
   * @param {object} [options]
   * @param {import("chalk").Color} [options.color] - Defaults to `"red"`.
   * @param {string} [options.tag] - Defaults to `"Error"`.
   * @returns {void}
   */
  static error(content, { color = "red", tag = "Error" } = {}) {
    this.write(content, { color, tag, error: true });
  }

  /**
   * @param {unknown} content
   * @param {object} [options]
   * @param {import("chalk").Color} [options.color] - Defaults to `"grey"`.
   * @param {string} [options.tag] - Defaults to `"Log"`.
   * @param {boolean} [options.error] - Writes to stderr instead of stdout when `true`.
   * @returns {void}
   */
  static write(content, { color = "grey", tag = "Log", error = false } = {}) {
    const timestamp = chalk.cyan(`[${moment().format("DD-MM-YYYY kk:mm:ss")}]:`);
    const levelTag = chalk.bold(`[${tag}]`);
    const text = chalk[color](this.clean(content));
    const stream = error ? process.stderr : process.stdout;
    stream.write(`${timestamp} ${levelTag} ${text}\n`);
  }

  /**
   * Passes strings through unmodified; deep-inspects anything else (errors, objects) into
   * a printable string.
   * @param {unknown} item
   * @returns {string}
   */
  static clean(item) {
    if (typeof item === "string") return item;
    const cleaned = util.inspect(item, { depth: Infinity });
    return cleaned;
  }
}
