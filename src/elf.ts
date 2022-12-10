import { debug } from "utils/debug";
import { Reader } from "./reader";

function text(arr: Uint8Array) {
    let str = "";
    arr.forEach(x => str += String.fromCharCode(x));

    return str;
}

function equals(arr: Uint8Array, arr2: Uint8Array) {
    if (arr.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

export enum ElfClass {
    Bit32 = 0x01,
    Bit64 = 0x02
}

export enum ElfEndianness {
    little = 0x01,
    big = 0x02
}

export enum ElfOsAbi {
    SystemV = 0x00,
    HP_UX = 0x01,
    NetBSD = 0x02,
    Linux = 0x03,
    GNU_Hurd = 0x04,
    Solaris = 0x06,
    AIX = 0x07,
    IRIX = 0x08,
    FreeBSD = 0x09,
    Tru64 = 0x0A,
    Novell_Modesto = 0x0B,
    OpenBSD = 0x0C,
    OpenVMS = 0x0D,
    NonStop_Kernel = 0x0E,
    AROS = 0x0F,
    Fenix_OS = 0x10,
    CloudABI = 0x11,
    Stratus_Technologies_OpenVOS = 0x12
}

export enum ElfFileType {
    None = 0x00,
    Relocatable = 0x01,
    Executable = 0x02,
    SharedObject = 0x03,
    Core = 0x04
}

export enum ElfTargerIsa {
    None = 0x00,
    SPARC = 0x02,
    x86 = 0x03,
    MIPS = 0x08,
    PowerPC = 0x14,
    ARM = 0x28,
}

export enum ElfSectionType {
    Null = 0x00,
    ProgramBits = 0x01,
    SymbolTable = 0x02,
    StringTable = 0x03,
    RelocationAddends = 0x04,
    HashTable = 0x05,
    DynamicLinkingInfo = 0x06,
    Note = 0x07,
    NoBits = 0x08,
    Relocation = 0x09,
    Shlib = 0x0A,
    DynamicLoaderSymbolTable = 0x0B,
    InitArray = 0x0E,
    FiniArray = 0x0F,
    PreinitArray = 0x10,
    Group = 0x11,
    SymbolTableIndex = 0x12,
    Num = 0x13,
}

export interface ElfSectionHeader {
    name: number;
    type: ElfSectionType;
    flags: number;
    address: number;
    offset: number;
    size: number;
    link: number;
    info: number;
    addressAlignment: number;
    entrySize: number;
}

export interface ElfHeader {
    magic: Uint8Array;
    class: ElfClass;
    endianness: ElfEndianness;
    elfVersion: number;
    osAbi: ElfOsAbi;
    osAbiVersion: number;
    fileType: ElfFileType;
    isa: ElfTargerIsa;
    version: number;
    entry: number;
    programHeaderOffset: number;
    sectionHeaderOffset: number;
    flags: number;
    headerSize: number;
    programHeaderSize: number;
    programHeaderCount: number;
    sectionHeaderSize: number;
    sectionHeaderCount: number;
    sectionHeaderStringTableIndex: number;
    elfSectionHeaders: ElfSectionHeader[];
}

function decodeSectionHeaders(buffer: Buffer, elfClass: ElfClass, offset: number, count: number) {
    const reader = Reader.from(buffer, offset);

    const sectionHeaders: ElfSectionHeader[] = [];

    for (let i = 0; i < count; i++) {
        const name = reader.readUInt32();
        const type: ElfSectionType = reader.readUInt32();
        const flags = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
        const address = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
        const offset = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
        const size = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
        const link = reader.readUInt32();
        const info = reader.readUInt32();
        const addressAlignment = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
        const entrySize = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();

        sectionHeaders.push({
            name,
            type,
            flags,
            address,
            offset,
            size,
            link,
            info,
            addressAlignment,
            entrySize
        });
    }

    return sectionHeaders;
}

export function getSectionName(buffer: Buffer, elf: ElfHeader, section: ElfSectionHeader) {
    const stringsSection = elf.elfSectionHeaders[elf.sectionHeaderStringTableIndex];

    const reader = Reader.from(buffer, stringsSection.offset + section.name);
    const decoder = new TextDecoder();
    const name = decoder.decode(reader.readUint8Array(0x100)).split("\x00")[0];
    return name;
}

export function decodeElfHeader(buffer: Buffer) {
    debug!(buffer.length);
    const reader = Reader.from(buffer);

    const magic = reader.readUint8Array(4);
    if (!equals(magic, new Uint8Array([0x7f, 0x45, 0x4c, 0x46]))) throw new Error("Invalid ELF magic");

    const elfClass: ElfClass = reader.readUInt8();
    const endianness: ElfEndianness = reader.readUInt8();
    const elfVersion = reader.readUInt8();
    const osAbi: ElfOsAbi = reader.readUInt8();
    const osAbiVersion = reader.readUInt8();

    reader.readUint8Array(7); // padding

    const fileType: ElfFileType = reader.readUInt16();
    const isa: ElfTargerIsa = reader.readUInt16();

    const version = reader.readUInt32();

    const entry = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
    const programHeaderOffset = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
    const sectionHeaderOffset = elfClass == ElfClass.Bit32 ? reader.readUInt32() : reader.readUInt64();
    const flags = reader.readUInt32();
    const headerSize = reader.readUInt16();
    const programHeaderEntrySize = reader.readUInt16();
    const programHeaderEntryCount = reader.readUInt16();
    const sectionHeaderEntrySize = reader.readUInt16();
    const sectionHeaderEntryCount = reader.readUInt16();
    const sectionHeaderStringTableIndex = reader.readUInt16();

    const elf: ElfHeader = {
        magic,
        class: elfClass,
        endianness,
        elfVersion,
        version,
        osAbi,
        osAbiVersion,
        fileType,
        isa,
        entry,
        programHeaderOffset,
        sectionHeaderOffset,
        flags,
        headerSize,
        programHeaderSize: programHeaderEntrySize,
        programHeaderCount: programHeaderEntryCount,
        sectionHeaderSize: sectionHeaderEntrySize,
        sectionHeaderCount: sectionHeaderEntryCount,
        sectionHeaderStringTableIndex,
        elfSectionHeaders: decodeSectionHeaders(buffer, elfClass, sectionHeaderOffset, sectionHeaderEntryCount)
    };

    debug!(reader.offset);

    return elf;
}
