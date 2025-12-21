import { createUnplugin, type UnpluginInstance } from "unplugin";

import { InlineConstEnum } from "./core/inline-const-enum";
import { resolveOptions } from "./core/options";
import type { IInlineConstEnumOptions } from "./core/types";

export const InlineConstEnumPlugin: UnpluginInstance<IInlineConstEnumOptions, false> = createUnplugin(
    (customOptions = {}) => {
        const options = resolveOptions(customOptions);
        const inlineConstEnum = new InlineConstEnum(options);

        return {
            name: "unplugin-inline-const-enum",
            enforce: "pre",
            vite: {
                apply: "build",
            },
            async buildStart() {
                await inlineConstEnum.loadTsModulesAsync();
                inlineConstEnum.scanConstEnums();
            },
            transform: {
                filter: {
                    id: {
                        include: options.include,
                        exclude: options.exclude,
                    },
                },
                handler(code, id) {
                    return inlineConstEnum.replaceConstEnumValues(code, id);
                },
            },
        };
    },
);
