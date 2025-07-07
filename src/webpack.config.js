import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
            },
            {
                test: /\.(m?js|node)$/,
                parser: { amd: false },
                use: {
                    loader: "@vercel/webpack-asset-relocator-loader",
                    options: {
                        existingAssetNames: []
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        module: true,
        path: path.resolve(__dirname, "dist"),
        clean: true
    },
    experiments: {
        outputModule: true 
    }
};