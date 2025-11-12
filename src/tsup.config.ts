import pkg from "./package.json";
import { defineConfig } from "tsup";

const OUT_DIR = "dist";

export default defineConfig({
    entry: {
        index: "index.ts",
    },
    splitting: true,
    sourcemap: false,
    clean: true,
    outDir: OUT_DIR,
    format: ["esm"],
    platform: "node",
    env: {
        NODE_ENV: "production"
    },
    target: ["node22", "es2024"],
    esbuildOptions: (options) => {
        if (options.format === "esm"){
            options.banner = {
                js: "import { createRequire as cr } from 'module'; const require = cr(import.meta.url);"
            };
        }
    },
    external: ["canvas"],
    noExternal: Object.keys(pkg.dependencies).filter((lib) => lib !== "canvas"),
    minify: true,
    treeshake: true,
    shims: true
});