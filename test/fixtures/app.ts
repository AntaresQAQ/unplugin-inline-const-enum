import {
    CE_DepInitializer,
    CE_ExportDep1,
    CE_ExportDep1Alias,
    CE_ExportDep2Alias1,
    CE_ExportDep2Alias2,
    CE_Initializer,
    CE_MixedInitializer,
    CE_NoInitializer,
    CE_StringInitializer,
} from "./enums";
import { CE_ExportDep2Alias } from "./enums-export2";

export const enumValues = {
    NoInitializer: {
        No: CE_NoInitializer.No,
        Yes: CE_NoInitializer.Yes,
    },
    Initializer: {
        Red: CE_Initializer.Red,
        Green: CE_Initializer.Green,
        Blue: CE_Initializer.Blue,
    },
    StringInitializer: {
        Up: CE_StringInitializer.Up,
        Down: CE_StringInitializer.Down,
        Left: CE_StringInitializer.Left,
        Right: CE_StringInitializer.Right,
    },
    MixedInitializer: {
        A: CE_MixedInitializer.A,
        B: CE_MixedInitializer.B,
        C: CE_MixedInitializer.C,
        D: CE_MixedInitializer.D,
        E: CE_MixedInitializer.E,
        F: CE_MixedInitializer.F,
        G: CE_MixedInitializer.G,
        H: CE_MixedInitializer.H,
        I: CE_MixedInitializer.I,
        J: CE_MixedInitializer.J,
        K: CE_MixedInitializer.K,
    },
    DepInitializer: {
        X: CE_DepInitializer.X,
        Y: CE_DepInitializer.Y,
        Z: CE_DepInitializer.Z,
    },
};

export function getEnumValues() {
    return {
        ExportDep1: {
            A: CE_ExportDep1.A,
            B: CE_ExportDep1.B,
            C: CE_ExportDep1.C,
            X: CE_ExportDep1.X,
            Y: CE_ExportDep1.Y,
            Z: CE_ExportDep1.Z,
        },
        ExportDep1Alias: {
            A: CE_ExportDep1Alias.A,
            B: CE_ExportDep1Alias.B,
            C: CE_ExportDep1Alias.C,
            X: CE_ExportDep1Alias.X,
            Y: CE_ExportDep1Alias.Y,
            Z: CE_ExportDep1Alias.Z,
        },
        ExportDep2: {
            X: CE_ExportDep1.X,
            Y: CE_ExportDep1.Y,
            Z: CE_ExportDep1.Z,
        },
        ExportDep2Alias: {
            X: CE_ExportDep2Alias.X,
            Y: CE_ExportDep2Alias.Y,
            Z: CE_ExportDep2Alias.Z,
        },
        ExportDep2Alias1: {
            X: CE_ExportDep2Alias1.X,
            Y: CE_ExportDep2Alias1.Y,
            Z: CE_ExportDep2Alias1.Z,
        },
        ExportDep2Alias2: {
            X: CE_ExportDep2Alias2.X,
            Y: CE_ExportDep2Alias2.Y,
            Z: CE_ExportDep2Alias2.Z,
        },
    };
}

export function duplicateUsage() {
    const a = CE_NoInitializer.Yes;
    const b = CE_Initializer.Green;
    const c = CE_StringInitializer.Left;
    const d = CE_MixedInitializer.F;
    const e = CE_DepInitializer.Y;

    return [a, b, c, d, e];
}
