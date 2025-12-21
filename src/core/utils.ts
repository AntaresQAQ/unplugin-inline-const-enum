import * as path from "path";

import type { IConstEnumMemberValue, IConstEnumName, IModuleSpecifier } from "./types";

export function printLog(message: string): void {
    console.log(`[uplugin-inline-const-enum] ${message}`.replaceAll(process.cwd(), "."));
}

export function isValidConstEnumMemberValue(value: unknown): value is IConstEnumMemberValue {
    return typeof value === "number" || typeof value === "string";
}

export function removeExtension(filePath: string): string {
    return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
}

export function makeEnumSpecifier(moduleSpecifier: IModuleSpecifier, enumName: IConstEnumName): string {
    return `${moduleSpecifier}::${enumName}`;
}

export function makeEnumMemberSpecifier(
    moduleSpecifier: IModuleSpecifier,
    enumName: IConstEnumName,
    memberName: IConstEnumMemberValue,
): string {
    return `${moduleSpecifier}::${enumName}::${memberName}`;
}

export function isEqualSet<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) {
        return false;
    }
    for (const item of a) {
        if (!b.has(item)) {
            return false;
        }
    }
    return true;
}
