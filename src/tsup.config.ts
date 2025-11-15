import pkg from "./package.json";
import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "index.ts",
    },
    splitting: true,
    sourcemap: false,
    clean: true,
    outDir: "dist",
    format: ["esm"],
    platform: "node",
    env: {
        NODE_ENV: "production"
    },
    target: ["node24"],
    external: ["canvas"],
    noExternal: Object.keys(pkg.dependencies).filter((lib) => lib !== "canvas"),
    minify: true,
    treeshake: true,
    shims: true,
    inject: ['cjs-shim.ts']
});