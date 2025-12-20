import type { babelParse } from "ast-kit";
import type { FilterPattern } from "unplugin";

export interface IInlineConstEnumOptions {
    /**
     * A glob or array of globs to include.
     * defaults to `/\.[cm]?[jt]sx?$/`
     */
    include?: FilterPattern;

    /**
     * A glob or array of globs to exclude.
     * defaults to "node_modules" and `/\.d\.[cm]?ts$/`
     */
    exclude?: FilterPattern;

    /**
     * The source directory for resolving modules.
     * Defaults to the current working directory.
     */
    sourceDir?: string;

    /**
     * A glob pattern to locate source files to scan for const enums.
     * Defaults to all `.ts`, `.cts`, `.mts`, and `.tsx` files in the source directory.
     */
    sourcePattern?: string;

    /**
     * The path to the tsconfig.json file.
     * Defaults to `tsconfig.json` in the current working directory.
     */
    tsConfig?: string;

    /**
     * Whether to enable debug logging.
     * Defaults to `false`.
     */
    debug?: boolean;
}

export type IResolvedInlineConstEnumOptions = Required<IInlineConstEnumOptions>;

export type IModuleSpecifier = string;
export type IConstEnumName = string;
export type IConstEnumMemberName = string;
export type IConstEnumMemberValue = number | string;
export type IConstEnumDefinition = Map<IConstEnumMemberName, IConstEnumMemberValue>;

export interface IConstEnumCommonDeclaration {
    definition: IConstEnumDefinition;
}
export interface IConstEnumImportedDeclaration {
    name: IConstEnumName | "default";
    from: IModuleSpecifier;
}
export type IConstEnumDeclaration = IConstEnumCommonDeclaration | IConstEnumImportedDeclaration;

export type IModuleMetadata = {
    constEnumDeclarations: Map<IConstEnumName, IConstEnumDeclaration>;
    exportedConstEnumDeclarations: Map<IConstEnumName | "default", IConstEnumName>;
};

export interface ITsModule {
    moduleSpecifier: IModuleSpecifier;
    ast: ReturnType<typeof babelParse>;
}
