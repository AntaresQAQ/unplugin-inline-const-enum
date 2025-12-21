import type {
    IConstEnumDeclaration,
    IConstEnumMemberName,
    IConstEnumMemberValue,
    IConstEnumName,
    IModuleMetadata,
    IModuleSpecifier,
    IResolvedInlineConstEnumOptions,
} from "./types";
import { makeEnumMemberSpecifier, printLog } from "./utils";

export class EnumCollection {
    private moduleMap: Map<IModuleSpecifier, IModuleMetadata> = new Map();
    private cache: Map<string, IConstEnumMemberValue> = new Map();

    constructor(private readonly options: IResolvedInlineConstEnumOptions) {}

    public setEnumDeclaration(
        moduleSpecifier: IModuleSpecifier,
        enumName: IConstEnumName,
        declaration: IConstEnumDeclaration,
    ): void {
        const moduleMetadata = this.ensureModuleMetadata(moduleSpecifier);
        moduleMetadata.constEnumDeclarations.set(enumName, declaration);
        if (this.options.debug) {
            if ("definition" in declaration) {
                printLog(`Registered const enum declaration: ${enumName} in module ${moduleSpecifier}`);
            } else {
                printLog(
                    `Registered imported const enum: { ${enumName} as ${declaration.name} } from ${declaration.from} in module ${moduleSpecifier}`,
                );
            }
        }
    }

    public setExportedEnum(
        moduleSpecifier: IModuleSpecifier,
        localEnumName: IConstEnumName,
        enumName?: IConstEnumName | "default",
    ): void {
        const moduleMetadata = this.ensureModuleMetadata(moduleSpecifier);
        moduleMetadata.exportedConstEnumDeclarations.set(enumName ?? localEnumName, localEnumName);
        if (this.options.debug) {
            printLog(
                `Registered exported const enum: { ${localEnumName} as ${enumName ?? localEnumName} } in module ${moduleSpecifier}`,
            );
        }
    }

    public hasEnumDeclaration(moduleSpecifier: IModuleSpecifier, enumName: IConstEnumName): boolean {
        const moduleMetadata = this.moduleMap.get(moduleSpecifier);
        if (!moduleMetadata) {
            return false;
        }

        if (moduleMetadata.exportedConstEnumDeclarations.has(enumName)) {
            return true;
        }

        if (moduleMetadata.constEnumDeclarations.has(enumName)) {
            return true;
        }

        return false;
    }

    public getEnumValues(
        moduleSpecifier: IModuleSpecifier,
        enumName: IConstEnumName | "default",
        memberName: IConstEnumMemberName,
    ): IConstEnumMemberValue | null {
        const cacheKey = makeEnumMemberSpecifier(moduleSpecifier, enumName, memberName);
        let resultValue: IConstEnumMemberValue | null = this.cache.get(cacheKey) ?? null;
        if (resultValue) {
            return resultValue;
        }

        const moduleMetadata = this.moduleMap.get(moduleSpecifier);
        if (!moduleMetadata) {
            return null;
        }

        // export { A as B }, we need to resolve to the local name
        const exportedEnumName = moduleMetadata.exportedConstEnumDeclarations.get(enumName);
        if (exportedEnumName) {
            enumName = exportedEnumName;
        }

        const enumDeclaration = moduleMetadata.constEnumDeclarations.get(enumName);
        if (!enumDeclaration) {
            return null;
        }

        if ("definition" in enumDeclaration) {
            resultValue = enumDeclaration.definition.get(memberName) ?? null;
        } else {
            resultValue = this.getEnumValues(enumDeclaration.from, enumDeclaration.name, memberName);
        }

        if (resultValue) {
            this.cache.set(cacheKey, resultValue);
        }

        return resultValue;
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public reset(): void {
        this.moduleMap.clear();
        this.cache.clear();
    }

    private ensureModuleMetadata(moduleSpecifier: IModuleSpecifier): IModuleMetadata {
        let moduleMetadata = this.moduleMap.get(moduleSpecifier);
        if (!moduleMetadata) {
            moduleMetadata = {
                constEnumDeclarations: new Map(),
                exportedConstEnumDeclarations: new Map(),
            };
            this.moduleMap.set(moduleSpecifier, moduleMetadata);
        }
        return moduleMetadata;
    }

    public printMapping(): void {
        for (const [moduleSpecifier, metadata] of this.moduleMap.entries()) {
            printLog(`Module: ${moduleSpecifier}`);
            for (const [enumName, declaration] of metadata.constEnumDeclarations.entries()) {
                printLog(`  Const Enum: ${enumName}`);
                if ("definition" in declaration) {
                    for (const [memberName, memberValue] of declaration.definition.entries()) {
                        printLog(`    ${memberName} = ${JSON.stringify(memberValue)}`);
                    }
                } else {
                    printLog(`    Imported from: ${declaration.from}, name: ${declaration.name}`);
                }
            }
            for (const [exportedName, localName] of metadata.exportedConstEnumDeclarations.entries()) {
                printLog(`  Exported Const Enum: { ${localName} as ${exportedName} }`);
            }
        }
    }
}
