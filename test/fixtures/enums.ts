export const enum CE_NoInitializer {
    No,
    Yes,
}

export const enum CE_Initializer {
    Red,
    Green = 5,
    Blue,
}

export const enum CE_StringInitializer {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}

// Mixed initializers
export const enum CE_MixedInitializer {
    A, // A = 0
    B = 2,
    C, // C = 3
    D = "Delta",
    E = "Echo",
    F = "Foxtrot",
    G = 10,
    H, // H = 11
    I, // I = 12,
    J = A,
    K = D,
}

export const enum CE_DepInitializer {
    X = CE_Initializer.Green,
    Y,
    Z = CE_NoInitializer.Yes,
}

export {
    CE_ExportDep1,
    CE_ExportDep1Alias,
    CE_ExportDep2,
    CE_ExportDep2Alias1,
    CE_ExportDep2Alias2,
} from "./enums-export1";
