import { CE_ExportDep2 } from "./enums-export2";

const enum CE_ExportDep1 {
    A = 1,
    B = 2,
    C = 3,
    X = CE_ExportDep2.X,
    Y = CE_ExportDep2.Y,
    Z = CE_ExportDep2.Z,
}

export { CE_ExportDep1, CE_ExportDep1 as CE_ExportDep1Alias };
export { CE_ExportDep2, CE_ExportDep2 as CE_ExportDep2Alias1 };

export { CE_ExportDep2Alias } from "./enums-export2";
export { CE_ExportDep2Alias as CE_ExportDep2Alias2 } from "./enums-export2";
