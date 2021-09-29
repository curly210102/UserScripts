import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import path from "path";
import fs from "fs";
import json from '@rollup/plugin-json';

export default [
  {
    input: "src/Juejin_Enhancer/main.js",
    output: {
      file: "Juejin_Enhancer/Juejin_activities.user.js",
    },
  },
  {
    input: "src/Ebook_Assistant/Ebook_Assistant.js",
    output: {
      file: "Ebook_Assistant/Ebook_Assistant.js",
    },
  },
].map(({ input, output }) => {
  return {
    input,
    output: {
      ...{
        format: "iife",
        banner: fs.readFileSync(
          path.join(input, "../", "UserScriptHeader.js"),
          "utf-8"
        ),
      },
      ...output,
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
    ],
  };
});
