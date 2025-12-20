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
            async buildStart() {
                await inlineConstEnum.loadTsModulesAsync();
                inlineConstEnum.scanConstEnums();
            },
            transform(_code, _id) {},
        };
    },
);
