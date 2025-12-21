import type { IInlineConstEnumOptions, IResolvedInlineConstEnumOptions } from "./types";

/**
 * Resolves the options for the plugin.
 * @param options - The options to resolve.
 * @returns The resolved options.
 */
export function resolveOptions(options: IInlineConstEnumOptions): IResolvedInlineConstEnumOptions {
    return {
        include: options.include || [/\.[cm]?[jt]sx?$/],
        exclude: options.exclude || [/node_modules/, /\.d\.[cm]?ts$/],
        sourceDir: options.sourceDir || process.cwd(),
        tsConfig: options.tsConfig || "tsconfig.json",
        sourcePattern: options.sourcePattern || "**/*.{ts,cts,mts,tsx}",
        debug: options.debug || false,
    };
}
