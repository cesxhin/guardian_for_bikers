import path from "path";
import {fileURLToPath} from "url";

export default {
    entry: "./index.ts",
    mode: "production",
    target: ["node", "es2020"],
    node: {
        global: true
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        module: true,
        libraryTarget: "module",
        path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist"),
        clean: true
    },
    experiments: {
        outputModule: true 
    }
};