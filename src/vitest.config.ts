import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        reporters: process.env.GITHUB_ACTIONS === "true" ? ["tree", "github-actions"] : ["tree"],
        env: {
            TOKEN_BOT: "test",
            USERNAME_BOT: "test"
        }
    }
});