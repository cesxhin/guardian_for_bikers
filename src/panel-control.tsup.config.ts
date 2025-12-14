import pkg from "./package.json";
import { defineConfig } from "tsup";

const PATH_OUT = "../setup/panel-control";

export default defineConfig({
    entry: {
        "panel-control": "./utility/index.ts"
    },
    splitting: false,
    sourcemap: false,
    clean: true,
    outDir: PATH_OUT,
    format: ["esm"],
    platform: "node",
    env: {
        NODE_ENV: "production"
    },
    target: ["node24", "esnext"],
    noExternal: Object.keys(pkg.dependencies),
    minify: true,
    treeshake: true,
    shims: true,
    inject: ["cjs-shim.ts"]
});