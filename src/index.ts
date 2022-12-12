import { bootstrap } from "utils";

bootstrap({
    all: true
});

import { bootstrapFfi, ffi } from "./ffi";
import { so } from "./so";

bootstrapFfi();

async function main() {
    const libhello = ffi(so!("../native/libhello.so"));

    const sum = libhello.sum({
        a: 1,
        b: 2,
    });

    libhello.hello({
        num: sum
    });
}

main();
