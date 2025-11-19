import fs from "node:fs";
import pkg from "./package.json";
import { defineConfig } from "tsup";
import path from "node:path";

const PATH_OUT = "dist";

export default defineConfig({
    entry: {
        index: "index.ts",
    },
    splitting: true,
    sourcemap: false,
    clean: true,
    outDir: PATH_OUT,
    format: ["esm"],
    platform: "node",
    env: {
        NODE_ENV: "production"
    },
    target: ["node24", "esnext"],
    external: ["canvas"],
    noExternal: Object.keys(pkg.dependencies).filter((lib) => lib !== "canvas"),
    minify: true,
    treeshake: true,
    shims: true,
    inject: ['cjs-shim.ts'],
    onSuccess: async () => {
        fs.cpSync("assets", path.join(PATH_OUT, "assets"), {recursive: true});
    }
});