import {
    type BinaryExpression,
    type ExportSpecifier,
    type Expression,
    type Identifier,
    type ImportDefaultSpecifier,
    type ImportSpecifier,
    type PrivateName,
    traverseFast,
    type TSEnumDeclaration,
} from "@babel/types";
import { babelParse, getLang, isTs } from "ast-kit";
import fg from "fast-glob";
import { readFile } from "fs/promises";
import MagicString from "magic-string";
import path from "path";
import tsConfigPaths from "tsconfig-paths";

import { DeferredSyncTask } from "./deferred-task";
import { EnumCollection } from "./enum-collection";
import type {
    IConstEnumCommonDeclaration,
    IConstEnumDefinition,
    IConstEnumImportedDeclaration,
    IConstEnumMemberName,
    IConstEnumMemberValue,
    IConstEnumName,
    IModuleSpecifier,
    IResolvedInlineConstEnumOptions,
    ITsModule,
} from "./types";
import { isValidConstEnumMemberValue, makeEnumSpecifier, printLog, removeExtension } from "./utils";

export class InlineConstEnum {
    private tsConfigMatchPath: tsConfigPaths.MatchPath;

    private readonly tsModules: ITsModule[] = [];
    private readonly enumCollection: EnumCollection;

    // Some const enum declarations may depend on other const enum declarations
    // We use a deferred task to handle such cases
    private readonly enumDeclarationDeferredTask = new DeferredSyncTask();

    // Specifiers of enums that are yet to be determined (imported/exported)
    // We don't know the specifier is a valid const enum until we find its declaration
    // When we find its declaration, we remove it from this set
    private readonly toBeDeterminedSpecifiers = new Set<string>();

    constructor(private readonly options: IResolvedInlineConstEnumOptions) {
        this.enumCollection = new EnumCollection(options);

        const result = tsConfigPaths.loadConfig(options.tsConfig);
        if (result.resultType === "failed") {
            throw new Error(result.message);
        }

        this.tsConfigMatchPath = tsConfigPaths.createMatchPath(result.absoluteBaseUrl, result.paths);
    }

    public replaceConstEnumValues(code: string, id: string): string {
        const strCode = new MagicString(code);
        const ast = babelParse(code, getLang(id));
        const moduleSpecifier = path.resolve(path.dirname(id), path.basename(id, path.extname(id)));
        traverseFast(ast, (node) => {
            if (
                node.type === "MemberExpression" &&
                node.object.type === "Identifier" &&
                node.property.type === "Identifier"
            ) {
                const enumName = node.object.name;
                const memberName = node.property.name;
                const enumValue = this.enumCollection.getEnumValues(moduleSpecifier, enumName, memberName);

                if (isValidConstEnumMemberValue(enumValue)) {
                    if (this.options.debug) {
                        printLog(
                            `Inlining const enum value: ${enumName}.${memberName} => ${JSON.stringify(enumValue)} in module ${moduleSpecifier}`,
                        );
                    }
                    strCode.overwrite(node.start!, node.end!, JSON.stringify(enumValue));
                }
            }
        });

        return strCode.toString();
    }

    public async loadTsModulesAsync(): Promise<void> {
        const files = await fg.async(this.options.sourcePattern, {
            cwd: this.options.sourceDir,
        });

        this.tsModules.push(
            ...(await Promise.all(
                files
                    .filter((file) => isTs(getLang(file)))
                    .map<Promise<ITsModule>>(async (file) => {
                        const fullPath = path.resolve(this.options.sourceDir, file);

                        // TS module name is the file path without extension
                        // because we don't add extension to the import statement in the code
                        const moduleSpecifier = removeExtension(fullPath);
                        return {
                            moduleSpecifier,
                            ast: babelParse(await readFile(fullPath, "utf-8"), getLang(file)),
                        };
                    }),
            )),
        );

        if (this.options.debug) {
            printLog(`Loaded TS modules:\n${this.tsModules.map((m) => `- ${m.moduleSpecifier}`).join("\n")}`);
        }
    }

    public scanConstEnums(): void {
        let prevToBeDeterminedCount: number;
        do {
            prevToBeDeterminedCount = this.toBeDeterminedSpecifiers.size;
            this.buildConstEnumDeclarations();
            this.enumDeclarationDeferredTask.executeAll();
        } while (
            this.enumDeclarationDeferredTask.hasWaitingExecutions() ||
            // The to-be-determined list size does not change in the this iteration
            // That means no new const enum declarations, imports or exports are found in this iteration
            (this.toBeDeterminedSpecifiers.size != prevToBeDeterminedCount && this.toBeDeterminedSpecifiers.size > 0)
        );
        if (this.options.debug) {
            this.enumCollection.printMapping();
        }
    }

    private buildConstEnumDeclarations(): void {
        for (const { moduleSpecifier, ast } of this.tsModules) {
            for (const node of ast.body) {
                if (node.type === "TSEnumDeclaration" && node.const) {
                    // const enum CE_XXX { ... }
                    this.buildConstEnumCommonDeclaration(node, moduleSpecifier);
                } else if (node.type === "ExportNamedDeclaration" && node.exportKind === "value") {
                    // export ...

                    if (node.declaration && node.declaration.type === "TSEnumDeclaration" && node.declaration.const) {
                        // export const enum CE_XXX { ... }
                        this.buildConstEnumCommonDeclaration(node.declaration, moduleSpecifier);
                        this.buildConstEnumExportedDeclaration(node.declaration, moduleSpecifier);
                        continue;
                    }

                    if (!node.declaration) {
                        // export { ... }
                        // export { ... } from ...
                        for (const specifier of node.specifiers) {
                            if (specifier.type === "ExportSpecifier" && specifier.exportKind === "value") {
                                if (node.source) {
                                    // export { CE_XXX } from ...
                                    // export { ... as CE_XXX } from ...
                                    // export { default as CE_XXX } from ...
                                    const importedModuleSpecifier = this.resolveImportedModuleSpecifier(
                                        node.source.value,
                                        moduleSpecifier,
                                    );
                                    this.buildConstEnumImportedDeclaration(
                                        specifier,
                                        moduleSpecifier,
                                        importedModuleSpecifier,
                                    );
                                }
                                this.buildConstEnumExportedDeclaration(specifier, moduleSpecifier);
                            }
                        }
                    }
                } else if (node.type === "ExportDefaultDeclaration" && node.declaration.type === "Identifier") {
                    // export default XXX
                    this.buildConstEnumExportedDeclaration(node.declaration, moduleSpecifier);
                } else if (node.type === "ImportDeclaration" && node.importKind === "value") {
                    // import ... from ...
                    const importedModuleSpecifier = this.resolveImportedModuleSpecifier(
                        node.source.value,
                        moduleSpecifier,
                    );

                    for (const specifier of node.specifiers) {
                        if (
                            (specifier.type === "ImportSpecifier" && specifier.importKind === "value") ||
                            specifier.type === "ImportDefaultSpecifier"
                        ) {
                            this.buildConstEnumImportedDeclaration(specifier, moduleSpecifier, importedModuleSpecifier);
                        }
                    }
                }
            }
        }
    }

    private buildConstEnumCommonDeclaration(node: TSEnumDeclaration, moduleSpecifier: IModuleSpecifier): void {
        const enumName = node.id.name;

        // Skip if the enum declaration already exists
        if (this.enumCollection.hasEnumDeclaration(moduleSpecifier, enumName)) {
            return;
        }

        const taskKey = makeEnumSpecifier(moduleSpecifier, enumName);
        const enumDeclaration: IConstEnumCommonDeclaration = {
            definition: new Map(),
        };

        let prevNonNumberItemInitialized = false;
        let itemIndex = 0;

        for (const member of node.members) {
            const memberName = member.id.type === "Identifier" ? member.id.name : member.id.value;
            let value: IConstEnumMemberValue | null;

            if (member.initializer) {
                // The current item have been initialized, calculate the value
                value = this.evaluateExpression(
                    member.initializer,
                    moduleSpecifier,
                    enumName,
                    memberName,
                    enumDeclaration.definition,
                );

                if (value === null) {
                    // The value is dependent on other unevaluated enum members, postpone the evaluation
                    this.enumDeclarationDeferredTask.addTask(taskKey, () => {
                        this.buildConstEnumCommonDeclaration(node, moduleSpecifier);
                    });
                    return;
                }

                if (!isValidConstEnumMemberValue(value)) {
                    throw new TypeError(
                        `Const enum member "${enumName}.${memberName}" in module ${moduleSpecifier} has unsupported type.`,
                    );
                }

                if (typeof value === "number") {
                    itemIndex = value;
                    prevNonNumberItemInitialized = false;
                } else {
                    prevNonNumberItemInitialized = true;
                }
            } else {
                if (prevNonNumberItemInitialized) {
                    throw new TypeError(
                        `Const enum member "${enumName}.${memberName}" in module ${moduleSpecifier} must have an initializer.`,
                    );
                }

                // The current item have not been initialized, use the index as the value
                value = itemIndex;
            }

            enumDeclaration.definition.set(memberName, value);

            itemIndex++;
        }

        this.enumCollection.setEnumDeclaration(moduleSpecifier, enumName, enumDeclaration);
    }

    private buildConstEnumImportedDeclaration(
        node: ImportSpecifier | ImportDefaultSpecifier | ExportSpecifier,
        moduleSpecifier: IModuleSpecifier,
        importedModuleSpecifier: IModuleSpecifier,
    ): void {
        const enumName = node.local.name;

        if (this.enumCollection.hasEnumDeclaration(moduleSpecifier, enumName)) {
            return;
        }

        const importedEnumName: IConstEnumName =
            node.type === "ExportSpecifier"
                ? node.local.name
                : node.type === "ImportDefaultSpecifier"
                  ? "default"
                  : node.imported.type === "Identifier"
                    ? node.imported.name
                    : node.imported.value;

        const enumSpecifier = makeEnumSpecifier(moduleSpecifier, enumName);
        if (this.enumCollection.hasEnumDeclaration(importedModuleSpecifier, importedEnumName)) {
            // The imported enum declaration is found, create the imported declaration
            // Remove from pending list
            this.toBeDeterminedSpecifiers.delete(enumSpecifier);

            const enumDeclaration: IConstEnumImportedDeclaration = {
                from: importedModuleSpecifier,
                name: importedEnumName,
            };

            this.enumCollection.setEnumDeclaration(moduleSpecifier, enumName, enumDeclaration);
        } else {
            // The imported enum declaration is not found yet, we don't know if it is a valid const enum import.
            // Add to pending list for the next scan iteration.
            this.toBeDeterminedSpecifiers.add(enumSpecifier);
        }
    }

    private buildConstEnumExportedDeclaration(
        node: ExportSpecifier | Identifier | TSEnumDeclaration,
        moduleSpecifier: IModuleSpecifier,
    ): void {
        const enumName =
            node.type === "ExportSpecifier"
                ? node.exported.type === "Identifier"
                    ? node.exported.name
                    : node.exported.value
                : node.type === "Identifier"
                  ? node.name
                  : node.id.name;

        if (this.enumCollection.hasEnumDeclaration(moduleSpecifier, enumName)) {
            return;
        }

        const localEnumName =
            node.type === "ExportSpecifier" ? node.local.name : node.type === "Identifier" ? "default" : node.id.name;

        const enumSpecifier = makeEnumSpecifier(moduleSpecifier, localEnumName);
        if (this.enumCollection.hasEnumDeclaration(moduleSpecifier, localEnumName)) {
            // The local enum declaration is found, create the exported declaration
            // Remove from pending list
            this.toBeDeterminedSpecifiers.delete(enumSpecifier);

            this.enumCollection.setExportedEnum(moduleSpecifier, localEnumName, enumName);
        } else {
            // The local enum declaration is not found yet, we don't know if it is a valid const enum to export.
            // Add to pending list for the next scan iteration.
            this.toBeDeterminedSpecifiers.add(enumSpecifier);
        }
    }

    private resolveImportedModuleSpecifier(sourceValue: string, moduleSpecifier: IModuleSpecifier): IModuleSpecifier {
        // Remove ts extensions
        if (isTs(getLang(sourceValue))) {
            sourceValue = removeExtension(sourceValue);
        }
        if (sourceValue.startsWith(".")) {
            // relative path
            return path.resolve(path.dirname(moduleSpecifier), sourceValue);
        } else if (sourceValue.startsWith("/")) {
            // absolute path
            return sourceValue;
        } else {
            // tsConfigPaths
            return (
                // ignore file exists check
                this.tsConfigMatchPath(sourceValue, undefined /* readJson */, () => true /* fileExists */) ??
                sourceValue
            );
        }
    }

    /**
     * Evaluates a const enum member expression.
     * @returns The evaluated value, `null` if the value is dependent on other unevaluated enum members.
     */
    private evaluateExpression(
        node: Expression | PrivateName,
        moduleSpecifier: IModuleSpecifier,
        enumName: IConstEnumName,
        memberName: IConstEnumMemberName,
        definition: IConstEnumDefinition,
    ): IConstEnumMemberValue | null {
        if (node.type === "NumericLiteral" || node.type === "StringLiteral") {
            // 1, "1"
            return node.value;
        } else if (node.type === "UnaryExpression") {
            // -1, +1, ~1
            const value = this.evaluateExpression(node.argument, moduleSpecifier, enumName, memberName, definition);
            if (value === null) {
                return value;
            }

            return this.evaluateConstExpression(`${node.operator} ${JSON.stringify(value)}`);
        } else if (node.type === "BinaryExpression") {
            // 1 + 2, SomeEnum.SomeMember + 1, etc.
            return this.evaluateBinaryExpression(node, moduleSpecifier, enumName, memberName, definition);
        } else if (
            node.type === "MemberExpression" &&
            node.object.type === "Identifier" &&
            node.property.type === "Identifier"
        ) {
            // SomeEnum.SomeMember
            // Check if the enum member is in the current definition
            if (node.object.name === enumName) {
                // Return undefined if the enum member value is not found in the current enum definition
                const value = definition.get(node.property.name);

                if (value === undefined) {
                    throw new TypeError(
                        `Const enum member "${enumName}.${memberName}" in module ${moduleSpecifier} has unsupported type.`,
                    );
                }

                return value;
            } else {
                // Return null if the enum member value is not found
                return this.enumCollection.getEnumValues(moduleSpecifier, node.object.name, node.property.name);
            }
        } else if (node.type === "Identifier") {
            // SomeMember
            // Check if the enum member is in the current definition
            const value = definition.get(node.name);

            if (value === undefined) {
                // SomeMember is not found in the current enum definition, but it may be a global const variable
                // We don't support global const variable for now
                // TODO: Support global const variable
                throw new TypeError(
                    `Const enum member "${enumName}.${memberName}" in module ${moduleSpecifier} has unsupported type.`,
                );
            }

            return value;
        } else {
            throw new TypeError(
                `Const enum member "${enumName}.${memberName}" in module ${moduleSpecifier} has unsupported type.`,
            );
        }
    }

    private evaluateBinaryExpression(
        binExp: BinaryExpression,
        moduleSpecifier: IModuleSpecifier,
        enumName: IConstEnumName,
        memberName: IConstEnumMemberName,
        definition: IConstEnumDefinition,
    ): IConstEnumMemberValue | null {
        const { left, right, operator } = binExp;
        const leftValue = this.evaluateExpression(left, moduleSpecifier, enumName, memberName, definition);
        if (leftValue === null) {
            return leftValue;
        }

        const rightValue = this.evaluateExpression(right, moduleSpecifier, enumName, memberName, definition);
        if (rightValue === null) {
            return rightValue;
        }

        return this.evaluateConstExpression(`${JSON.stringify(leftValue)} ${operator} ${JSON.stringify(rightValue)}`);
    }

    private evaluateConstExpression(express: string): IConstEnumMemberValue {
        return new Function(`return ${express}`)();
    }
}
