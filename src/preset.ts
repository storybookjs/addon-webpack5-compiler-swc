import { getProjectRoot } from "@storybook/core-common";
import type { Options } from "@storybook/types";
import type { Options as SwcOptions } from "@swc/core";
import type { Configuration } from "webpack";

const virtualModuleFiles = [
  /storybook-config-entry\.js$/,
  /storybook-stories\.js$/,
];

export const webpackFinal = async (config: Configuration, options: Options) => {
  const swcDefaultOptions: SwcOptions = {
    env: {
      // Transpiles the broken syntax to the closest non-broken modern syntax.
      // E.g. it won't transpile parameter destructuring in Safari
      // which would break how we detect if the mount context property is used in the play function.
      bugfixes: true,
    },
    jsc: {
      transform: {
        react: {
          runtime: "automatic",
        },
      },
      parser: {
        syntax: "typescript",
        tsx: true,
        dynamicImport: true,
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
        include: [getProjectRoot()],
        exclude: [/node_modules/, ...virtualModuleFiles],
      },
    ],
  };

  return config;
};
