// LICENSE : MIT
"use strict";
import { TextlintFixResult } from "@textlint/types";

const fs = require("fs");
const path = require("path");
const tryResolve = require("try-resolve");
const interopRequire = require("interop-require");
const isFile = require("is-file");
const debug = require("debug")("textlint:textfix-formatter");

export type FormatterConfig = { color?: boolean; formatterName: string };

export function createFormatter(formatterConfig: FormatterConfig) {
    const formatterName = formatterConfig.formatterName;
    debug(`formatterName: ${formatterName}`);
    let formatter: (results: TextlintFixResult[], formatterConfig: FormatterConfig) => string;
    let formatterPath;
    if (fs.existsSync(formatterName)) {
        formatterPath = formatterName;
    } else if (fs.existsSync(path.resolve(process.cwd(), formatterName))) {
        formatterPath = path.resolve(process.cwd(), formatterName);
    } else {
        if (isFile(`${path.join(__dirname, "formatters/", formatterName)}.js`)) {
            formatterPath = `${path.join(__dirname, "formatters/", formatterName)}.js`;
        } else if (isFile(`${path.join(__dirname, "formatters/", formatterName)}.ts`)) {
            formatterPath = `${path.join(__dirname, "formatters/", formatterName)}.ts`;
        } else {
            const pkgPath = tryResolve(`textlint-formatter-${formatterName}`) || tryResolve(formatterName);
            if (pkgPath) {
                formatterPath = pkgPath;
            }
        }
    }
    try {
        formatter = interopRequire(formatterPath);
    } catch (ex) {
        throw new Error(`Could not find formatter ${formatterName}
See https://github.com/textlint/textlint/issues/148
${ex}`);
    }
    debug(`use formatter: ${formatterPath}`);
    return function(results: TextlintFixResult[]) {
        return formatter(results, formatterConfig);
    };
}

export interface FixerFormatterDetail {
    name: string;
}

export function getFixerFormatterList(): FixerFormatterDetail[] {
    return fs
        .readdirSync(path.join(__dirname, "formatters"))
        .filter((file: string) => {
            return path.extname(file) === ".js";
        })
        .map((file: string) => {
            return { name: path.basename(file, ".js") };
        });
}
