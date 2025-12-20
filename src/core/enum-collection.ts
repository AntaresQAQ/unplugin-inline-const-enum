import type {
    IConstEnumDeclaration,
    IConstEnumMemberName,
    IConstEnumMemberValue,
    IConstEnumName,
    IModuleMetadata,
    IModuleSpecifier,
} from "./types";

export class EnumCollection {
    private moduleMap: Map<IModuleSpecifier, IModuleMetadata> = new Map();
    private cache: Map<string, IConstEnumMemberValue> = new Map();

    public setEnumDeclaration(
        moduleSpecifier: IModuleSpecifier,
        enumName: IConstEnumName,
        declaration: IConstEnumDeclaration,
    ): void {
        const moduleMetadata = this.ensureModuleMetadata(moduleSpecifier);
        moduleMetadata.constEnumDeclarations.set(enumName, declaration);
    }

    public setExportedEnum(
        moduleSpecifier: IModuleSpecifier,
        localEnumName: IConstEnumName,
        enumName?: IConstEnumName | "default",
    ): void {
        const moduleMetadata = this.ensureModuleMetadata(moduleSpecifier);
        moduleMetadata.exportedConstEnumDeclarations.set(enumName ?? localEnumName, localEnumName);
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
        const cacheKey = `${moduleSpecifier}::${enumName}::${memberName}`;
        let resultValue: IConstEnumMemberValue | null = this.cache.get(cacheKey) ?? null;
        if (resultValue) {
            return resultValue;
        }

        const moduleMetadata = this.moduleMap.get(moduleSpecifier);
        if (!moduleMetadata) {
            return null;
        }

        const enumDeclaration = moduleMetadata.constEnumDeclarations.get(enumName);
        if (enumDeclaration) {
            if ("definition" in enumDeclaration) {
                resultValue = enumDeclaration.definition.get(memberName) ?? null;
            } else {
                resultValue = this.getEnumValues(enumDeclaration.from, enumDeclaration.name, memberName);
            }

            if (resultValue) {
                this.cache.set(cacheKey, resultValue);
            }
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
}
