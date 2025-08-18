import fs from "node:fs";
import path from "node:path";

import type { Options as SwcOptions } from "@swc/core";
import { getProjectRoot } from "storybook/internal/common";
import type { Options } from "storybook/internal/types";
import type { Configuration } from "webpack";

const virtualModuleFiles = [
  /storybook-config-entry\.js$/,
  /storybook-stories\.js$/,
];

const root = getProjectRoot();

function findSWCConfigFile() {
  const potentialPaths = [
    // @ts-expect-error TS4111
    process.env.SWC_CONFIG_PATH ?? "",
    path.join(process.cwd(), ".swcrc"),
    path.join(root, ".swcrc"),
  ];

  return potentialPaths.find((filePath) => fs.existsSync(filePath)) ?? null;
}

const swcConfigPath: string | null = findSWCConfigFile();

export const webpackFinal = async (config: Configuration, options: Options) => {
  const swcConfigFileOptions: SwcOptions = swcConfigPath
    ? JSON.parse(fs.readFileSync(swcConfigPath, "utf-8"))
    : {};

  const swcDefaultOptions: SwcOptions = {
    ...(swcConfigFileOptions ?? {}),
    env: {
      // Transpiles the broken syntax to the closest non-broken modern syntax.
      // E.g. it won't transpile parameter destructuring in Safari
      // which would break how we detect if the mount context property is used in the play function.
      bugfixes: true,
      ...(swcConfigFileOptions.env ?? {}),
    },
    jsc: {
      ...(swcConfigFileOptions.jsc ?? {}),
      transform: {
        react: {
          runtime: "automatic",
          ...(swcConfigFileOptions.jsc?.transform?.react ?? {}),
        },
        ...(swcConfigFileOptions.jsc?.transform ?? {}),
      },
      parser: {
        tsx: true,
        dynamicImport: true,
        ...(swcConfigFileOptions.jsc?.parser ?? {}),
        syntax: swcConfigFileOptions.jsc?.parser?.syntax ?? "typescript",
      },
    },
  };

  const swcOptions = await options.presets.apply(
    "swc",
    swcDefaultOptions,
    options,
  );

  const typescriptOptions = await options.presets.apply(
    "typescript",
    {},
    options,
  );

  config.module = {
    ...(config.module || {}),
    rules: [
      ...(config.module?.rules || []),
      {
        test: typescriptOptions.skipCompiler
          ? /\.((c|m)?jsx?)$/
          : /\.((c|m)?(j|t)sx?)$/,
        use: [
          {
            loader: require.resolve("swc-loader"),
            options: swcOptions,
          },
        ],
        include: [root],
        exclude: [/node_modules/, ...virtualModuleFiles],
      },
    ],
  };

  return config;
};
