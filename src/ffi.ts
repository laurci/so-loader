import { provider } from "@laurci/injector/lib";
import * as path from "path";
import * as NodeFfi from "ffi-napi";

import type { ImplementedFunctionDeclaration } from "./dwarf";

type So = Record<string, any>;

type FFI<T extends So> = {
    [key in keyof T]: (args: T[key]["parameters"]) => T[key]["returnType"];
}

interface ProcessedSo {
    filePath: string;
    declarations: ImplementedFunctionDeclaration[];
}

export function ffi<T extends So>(_so: T): FFI<T> {
    const so = _so as unknown as ProcessedSo;
    const functions: Record<string, [string, string[]]> = {};
    for (const declaration of so.declarations) {
        functions[declaration.name] = [
            declaration.returnType,
            declaration.parameters.map(p => p.type),
        ];
    }

    const binding = NodeFfi.Library(so.filePath, functions);

    const proxy: Record<string, (args: any) => any> = {};

    for (const declaration of so.declarations) {
        proxy[declaration.name] = (args: any) => {
            return binding[declaration.name](...declaration.parameters.map((p) => args[p.name]));
        }
    }

    return proxy as unknown as FFI<T>;
}

export function bootstrapFfi() {
    provider!(function so(dirname: string, filename: string, declarationsStr: string) {
        const declarations = JSON.parse(declarationsStr) as ImplementedFunctionDeclaration[];
        const filePath = path.join(dirname, filename);
        const data = {
            filePath,
            declarations,
        };
        return data;
    })
}
