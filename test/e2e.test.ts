import path from "path";
import type ViteInlineConstEnumPlugin from "unplugin-inline-const-enum/vite";
import { build, type InlineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { describe, expect, it } from "vitest";

describe("E2E - Inline Const Enum Plugin", () => {
    const sourceDir = path.resolve(__dirname, "fixtures");
    const tsConfig = path.resolve(sourceDir, "tsconfig.json");
    const entry = path.resolve(sourceDir, "app.ts");

    async function buildWithPluginAsync(plugin: typeof ViteInlineConstEnumPlugin) {
        const config: InlineConfig = {
            root: path.dirname(entry),
            plugins: [
                plugin({
                    sourceDir,
                    sourcePattern: "**/*.ts",
                    tsConfig,
                    debug: false,
                }),
                tsconfigPaths({
                    projects: [tsConfig],
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

    it("should inline const enums correctly - dev", async () => {
        const { ViteInlineConstEnumPlugin } = await import("../src/vite");
        const result = await buildWithPluginAsync(ViteInlineConstEnumPlugin);
        expect(result).toBeDefined();
        expect(result.output).toHaveLength(1);
        expect(result.output[0].code).toMatchSnapshot();
    });

    it("should inline const enums correctly - prod", async () => {
        const { ViteInlineConstEnumPlugin } = await import("unplugin-inline-const-enum/vite");
        const result = await buildWithPluginAsync(ViteInlineConstEnumPlugin);
        expect(result).toBeDefined();
        expect(result.output).toHaveLength(1);
        expect(result.output[0].code).toMatchSnapshot();
    });
});
