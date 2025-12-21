import { InlineConstEnumPlugin } from ".";

const esbuild: typeof InlineConstEnumPlugin.esbuild = InlineConstEnumPlugin.esbuild;
export default esbuild;
export { esbuild as EsbuildInlineConstEnumPlugin };
