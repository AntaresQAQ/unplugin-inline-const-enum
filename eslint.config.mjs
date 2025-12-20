import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

const IGNORED_FILES = ["node_modules/**", "dist/**", ".yarn/*", ".pnp.*", ".github/*"];
const TS_FILES = ["src/**/*.{ts,cts,mts}"];
const JS_FILES = ["src/**/*.{js,cjs,mjs}", "eslint.config.mjs"];

export default defineConfig(
    js.configs.recommended,
    tseslint.configs.recommended,
    prettierRecommended,
    {
        files: TS_FILES,
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: {
                    defaultProject: "tsconfig.json",
                    tsconfigRootDir: import.meta.dirname,
                },
            },
        },
    },
    {
        files: [...TS_FILES, ...JS_FILES],
        languageOptions: {
            globals: globals.node,
        },
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "arrow-parens": ["error", "always"],
            curly: ["error", "multi-line"],
            "import/no-cycle": "off",
            "no-empty": "off",
            "no-extend-native": "error",
            "no-unused-vars": "off",

            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": "error",

            "prettier/prettier": [
                "error",
                {},
                {
                    usePrettierrc: true,
                },
            ],

            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "explicit",
                    overrides: {
                        constructors: "no-public",
                    },
                },
            ],
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "interface",
                    format: ["PascalCase"],
                    prefix: ["I"],
                },
                {
                    selector: "enum",
                    format: ["PascalCase"],
                    prefix: ["CE_", "E_"],
                },
                {
                    selector: "enumMember",
                    format: ["PascalCase", "UPPER_CASE", "snake_case"],
                },
                {
                    selector: ["function", "classMethod"],
                    modifiers: ["async"],
                    format: ["camelCase", "PascalCase"],
                    suffix: ["Async", "AsyncAction"],
                },
            ],
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-duplicate-enum-values": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    vars: "local",
                    args: "after-used",
                    caughtErrors: "all",
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/prefer-as-const": "error",
        },
    },
    { ignores: IGNORED_FILES },
);
