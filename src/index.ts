import { bootstrap } from "utils";

bootstrap({
    all: true
});

import * as fs from "fs";

import { debug } from "utils/debug";

import { decodeElfHeader } from "./elf";
import { decodeDwarf } from "./dwarf";

async function main() {
    const buffer = fs.readFileSync("./native/libhello.so");
    const elfHeader = decodeElfHeader(buffer);

    const dwarf = decodeDwarf(buffer, elfHeader);
    debug!(dwarf);
}

main();
