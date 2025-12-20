import type { IConstEnumMemberValue } from "./types";

export function printLog(message: string): void {
    console.log(`[uplugin-inline-const-enum] ${message}`.replaceAll(process.cwd(), "."));
}

export function isValidConstEnumMemberValue(value: unknown): value is IConstEnumMemberValue {
    return typeof value === "number" || typeof value === "string";
}
