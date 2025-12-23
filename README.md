# unplugin-inline-const-enum

[![npm version](https://img.shields.io/npm/v/unplugin-inline-const-enum.svg)](https://www.npmjs.com/package/unplugin-inline-const-enum)
[![CI](https://github.com/AntaresQAQ/unplugin-inline-const-enum/workflows/CI/badge.svg)](https://github.com/AntaresQAQ/unplugin-inline-const-enum/actions)

A universal plugin for inlining TypeScript const enums at build time. Powered by [unplugin](https://github.com/unjs/unplugin), it works seamlessly with Vite, Rollup, Rolldown, esbuild, and Webpack.

## 🚀 Features

- ✨ **Universal Support**: Works with Vite, Rollup, Rolldown, esbuild, and Webpack
- 🔍 **Smart Resolution**: Automatically resolves const enum values across modules
- 📦 **Zero Runtime Overhead**: Replaces const enum references with literal values at build time
- 🌐 **Import/Export Handling**: Supports complex import/export scenarios including aliases
- 🔗 **Dependency Tracking**: Handles const enums that depend on other const enums
- 🎯 **TypeScript Path Mapping**: Respects `tsconfig.json` path aliases
- 💪 **Type-safe**: Written in TypeScript with full type definitions

## 📦 Installation

```bash
npm install -D unplugin-inline-const-enum
# or
yarn add -D unplugin-inline-const-enum
# or
pnpm add -D unplugin-inline-const-enum
```

## 🎯 Usage

### Vite

```typescript
// vite.config.ts
import InlineConstEnumPlugin from "unplugin-inline-const-enum/vite";

export default {
    plugins: [
        InlineConstEnumPlugin({
            sourceDir: "./src",
            tsConfig: "./tsconfig.json",
        }),
    ],
};
```

### Rollup

```typescript
// rollup.config.js
import InlineConstEnumPlugin from "unplugin-inline-const-enum/rollup";

export default {
    plugins: [
        InlineConstEnumPlugin({
            sourceDir: "./src",
            tsConfig: "./tsconfig.json",
        }),
    ],
};
```

### Rolldown

```typescript
// rolldown.config.js
import InlineConstEnumPlugin from "unplugin-inline-const-enum/rolldown";

export default {
    plugins: [
        InlineConstEnumPlugin({
            sourceDir: "./src",
            tsConfig: "./tsconfig.json",
        }),
    ],
};
```

### esbuild

```typescript
// esbuild.config.js
import InlineConstEnumPlugin from "unplugin-inline-const-enum/esbuild";

require("esbuild").build({
    plugins: [
        InlineConstEnumPlugin({
            sourceDir: "./src",
            tsConfig: "./tsconfig.json",
        }),
    ],
});
```

### Webpack

```typescript
// webpack.config.js
module.exports = {
    plugins: [
        require("unplugin-inline-const-enum/webpack")({
            sourceDir: "./src",
            tsConfig: "./tsconfig.json",
        }),
    ],
};
```

## ⚙️ Options

```typescript
interface IInlineConstEnumOptions {
  /**
   * A glob or array of globs to include.
   * @default /\.[cm]?[jt]sx?$/
   */
  include?: FilterPattern

  /**
   * A glob or array of globs to exclude.
   * @default [/node_modules/, /\.d\.[cm]?ts$/]
   */
  exclude?: FilterPattern

  /**
   * The source directory for resolving modules.
   * @default process.cwd()
   */
  sourceDir?: string

  /**
   * A glob pattern to locate source files to scan for const enums.
   * @default '**/*.{ts,cts,mts,tsx}'
   */
  sourcePattern?: string

  /**
   * The path to the tsconfig.json file.
   * @default 'tsconfig.json'
   */
  tsConfig?: string

  /**
   * Whether to enable debug logging.
   * @default false
   */
  debug?: boolean
}
```

## 📝 Example

### Input

```typescript
// enums.ts
export const enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}

export const enum Status {
    Pending,
    Success = 200,
    Error = 500,
}

// app.ts
import { Direction, Status } from "./enums";

console.log(Direction.Up);
console.log(Status.Success);
```

### Output

```typescript
// app.ts (transformed)
console.log("UP");
console.log(200);
```

## 🎨 Advanced Features

### Cross-Module Resolution

The plugin handles const enums imported from other modules:

```typescript
// module-a.ts
export const enum Colors {
    Red,
    Green = 5,
    Blue,
}

// module-b.ts
import { Colors } from "./module-a";

export const color = Colors.Green; // → 5
```

### Dependency Resolution

Handles const enums that reference other const enums:

```typescript
export const enum Base {
    A = 10,
    B = 20,
}

export const enum Derived {
    X = Base.A, // → 10
    Y = Base.B, // → 20
}
```

### Export Aliases

Works with re-exports and aliases:

```typescript
// enums.ts
export { Status as HttpStatus } from "./http-status";

// app.ts
import { HttpStatus } from "./enums";
console.log(HttpStatus.OK); // → 200
```

## 🔧 How It Works

1. **Scan Phase**: Parses all TypeScript files to collect const enum definitions
2. **Analysis Phase**: Builds a dependency graph of const enums
3. **Transform Phase**: Replaces const enum references with their literal values during the build

## ⚠️ Known Limitations

1. **Const Variable References Not Supported**: The plugin does not support const enum members whose values are expressions containing non-const-enum variables. For example:

    ```typescript
    const varX = 1;
    const enum MyEnum {
        X = varX, // ❌ Not supported
    }
    ```

    Only literal values and references to other const enum members are supported:

    ```typescript
    const enum MyEnum {
        X = 1, // ✅ Supported
        Y = MyEnum.X + 2, // ✅ Supported
    }
    ```

2. **Const Enum Definitions Not Removed**: The plugin only inlines const enum values but does not remove the const enum definitions from the output. To eliminate unused const enum declarations, you should rely on tree-shaking tools (like Rollup or Webpack with `mode: 'production'`) to remove the dead code.

3. **Namespace Import/Export Not Supported**: The plugin cannot inline const enums when they are accessed through namespace imports or re-exported through namespace exports.

    **Not supported - Namespace import:**

    ```typescript
    // a.ts
    export const enum CE_Test {
        X = 1,
        Y = 2,
    }

    // b.ts
    import * as A from "./a";
    const X = A.CE_Test.X; // ❌ Won't be inlined
    ```

    **Not supported - Namespace export/import:**

    ```typescript
    // a.ts
    export const enum CE_Test {
        X = 1,
        Y = 2,
    }

    // b.ts
    export * from "./a";

    // c.ts
    import { CE_Test } from "./b";
    const X = CE_Test.X; // ❌ Won't be inlined, CE_Test is exported by namespace
    ```

    **Workaround**: Use named imports instead:

    ```typescript
    // b.ts
    import { CE_Test } from "./a";
    const X = CE_Test.X; // ✅ Will be inlined
    ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/YOUR_USERNAME/unplugin-inline-const-enum/issues).
