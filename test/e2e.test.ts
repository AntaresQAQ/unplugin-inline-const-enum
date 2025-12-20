import path from "path";
import { build, type InlineConfig } from "vite";
import { describe, expect, it } from "vitest";

import { ViteInlineConstEnumPlugin } from "../src/vite";

describe("E2E - Inline Const Enum Plugin", () => {
    const fixturesDir = path.resolve(__dirname, "fixtures");
    const tsConfigPath = path.resolve(fixturesDir, "tsconfig.json");

    async function buildWithPluginAsync(entry: string, sourceDir: string, tsConfig: string) {
        const config: InlineConfig = {
            root: path.dirname(entry),
            plugins: [
                ViteInlineConstEnumPlugin({
                    sourceDir,
                    sourcePattern: "**/*.ts",
                    tsConfig,
                }),
            ],
            build: {
                lib: {
                    entry,
                    formats: ["es"],
                    fileName: "output",
                },
                write: false,
                minify: true,
            },
        };

        const result = await build(config);
        if (!Array.isArray(result)) {
            return result;
        }
        return result[0];
    }

    it("should inline const enums correctly", async () => {
        const entry = path.resolve(fixturesDir, "app.ts");
        const result = await buildWithPluginAsync(entry, fixturesDir, tsConfigPath);

        expect(result).matchSnapshot();
    });
});
