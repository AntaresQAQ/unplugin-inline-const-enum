import { createUnplugin, type UnpluginInstance } from "unplugin";

import { InlineConstEnum } from "./core/inline-const-enum";
import { resolveOptions } from "./core/options";
import type { IInlineConstEnumOptions } from "./core/types";

export const InlineConstEnumPlugin: UnpluginInstance<IInlineConstEnumOptions, false> = createUnplugin(
    (customOptions = {}) => {
        const options = resolveOptions(customOptions);
        const inlineConstEnum = new InlineConstEnum(options);
        const includes = Array.isArray(options.include) ? options.include : [options.include];
        const excludes = Array.isArray(options.exclude) ? options.exclude : [options.exclude];

        return {
            name: "unplugin-inline-const-enum",
            enforce: "pre",
            async buildStart() {
                await inlineConstEnum.loadTsModulesAsync();
                inlineConstEnum.scanConstEnums();
            },
            transform(code, id) {
                if (
                    !includes.some((pattern) =>
                        typeof pattern === "string"
                            ? id.includes(pattern)
                            : pattern instanceof RegExp
                              ? pattern.test(id)
                              : false,
                    )
                ) {
                    return null;
                }

                if (
                    excludes.some((pattern) =>
                        typeof pattern === "string"
                            ? id.includes(pattern)
                            : pattern instanceof RegExp
                              ? pattern.test(id)
                              : false,
                    )
                ) {
                    return null;
                }

                return inlineConstEnum.replaceConstEnumValues(code, id);
            },
        };
    },
);
