import path from "path";
import { ViteInlineConstEnumPlugin } from "unplugin-inline-const-enum/vite";
import { build, type InlineConfig } from "vite";
import { describe, expect, it } from "vitest";

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
                minify: false,
            },
        };

        const result = await build(config);
        if (Array.isArray(result)) {
            return result[0];
        }

        return { ...result, output: [] };
    }

    it("should inline const enums correctly", async () => {
        const entry = path.resolve(fixturesDir, "app.ts");
        const result = await buildWithPluginAsync(entry, fixturesDir, tsConfigPath);
        expect(result).toBeDefined();
        expect(result.output).toHaveLength(1);
        expect(result.output[0].code).toMatchSnapshot();
    });
});
