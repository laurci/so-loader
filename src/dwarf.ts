import { debug } from "utils/debug";
import { ElfHeader, getSectionName } from "./elf";
import { Reader } from "./reader";

export interface Dwarf {
    compilationUnits: CompilationUnit[];
}

enum AbbreviationTag {
    NULL = 0x00,
    ArrayType = 0x01,
    ClassType = 0x02,
    EntryPoint = 0x03,
    EnumerationType = 0x04,
    FormalParameter = 0x05,
    ImportedDeclaration = 0x08,
    Label = 0x0A,
    LexicalBlock = 0x0B,
    Member = 0x0D,
    PointerType = 0x0F,
    ReferenceType = 0x10,
    CompileUnit = 0x11,
    StringType = 0x12,
    StructureType = 0x13,
    SubroutineType = 0x15,
    Typedef = 0x16,
    UnionType = 0x17,
    UnspecifiedParameters = 0x18,
    Variant = 0x19,
    CommonBlock = 0x1A,
    CommonInclusion = 0x1B,
    Inheritance = 0x1C,
    InlinedSubroutine = 0x1D,
    Module = 0x1E,
    PointerToMemberType = 0x1F,
    SetType = 0x20,
    SubrangeType = 0x21,
    WithStatement = 0x22,
    AccessDeclaration = 0x23,
    BaseType = 0x24,
    CatchBlock = 0x25,
    ConstType = 0x26,
    Constant = 0x27,
    Enumerator = 0x28,
    FileType = 0x29,
    Friend = 0x2A,
    Namelist = 0x2B,
    NamelistItem = 0x2C,
    PackedType = 0x2D,
    Subprogram = 0x2E,
    TemplateTypeParameter = 0x2F,
    TemplateValueParameter = 0x30,
    ThrownType = 0x31,
    TryBlock = 0x32,
    VariantPart = 0x33,
    Variable = 0x34,
    VolatileType = 0x35,
    DwarfProcedure = 0x36,
    RestrictType = 0x37,
    InterfaceType = 0x38,
    Namespace = 0x39,
    ImportedModule = 0x3A,
    UnspecifiedType = 0x3B,
    PartialUnit = 0x3C,
    ImportedUnit = 0x3D,
    Condition = 0x3F,
    SharedType = 0x40,
    TypeUnit = 0x41,
    RvalueReferenceType = 0x42,
    TemplateAlias = 0x43,
    CoArrayType = 0x44,
    GenericSubrange = 0x45,
    DynamicType = 0x46,
    AtomicType = 0x47,
    CallSite = 0x48,
    CallSiteParameter = 0x49,
    SkeletonUnit = 0x4A,
    ImmutableType = 0x4B,
}

export enum AbbreviationAttributeForm {
    NULL = 0x00,
    Address = 0x01,
    Block2 = 0x03,
    Block4 = 0x04,
    Data2 = 0x05,
    Data4 = 0x06,
    Data8 = 0x07,
    String = 0x08,
    Block = 0x09,
    Block1 = 0x0A,
    Data1 = 0x0B,
    Flag = 0x0C,
    SData = 0x0D,
    Strp = 0x0E,
    UData = 0x0F,
    RefAddr = 0x10,
    Ref1 = 0x11,
    Ref2 = 0x12,
    Ref4 = 0x13,
    Ref8 = 0x14,
    RefUData = 0x15,
    Indirect = 0x16,
    SecOffset = 0x17,
    ExprLoc = 0x18,
    FlagPresent = 0x19,
    Strx = 0x1A,
    AddrX = 0x1B,
    RefSup4 = 0x1C,
    StrpSup = 0x1D,
    Data16 = 0x1E,
    LineStrp = 0x1F,
    RefSig8 = 0x20,
    ImplicitConst = 0x21,
    LocListX = 0x22,
    RngListX = 0x23,
    RefSup8 = 0x24,
    Strx1 = 0x25,
    Strx2 = 0x26,
    Strx3 = 0x27,
    Strx4 = 0x28,
    AddrX1 = 0x29,
    AddrX2 = 0x2A,
    AddrX3 = 0x2B,
    AddrX4 = 0x2C,
}

export enum AbbreviationAttributeName {
    NULL = 0x00,
    Sibling = 0x01,
    Location = 0x02,
    Name = 0x03,
    Ordering = 0x09,
    ByteSize = 0x0B,
    BitOffset = 0x0C,
    BitSize = 0x0D,
    StmtList = 0x10,
    LowPc = 0x11,
    HighPc = 0x12,
    Language = 0x13,
    Discr = 0x15,
    DiscrValue = 0x16,
    Visibility = 0x17,
    Import = 0x18,
    StringLength = 0x19,
    CommonReference = 0x1A,
    CompDir = 0x1B,
    ConstValue = 0x1C,
    ContainingType = 0x1D,
    DefaultValue = 0x1E,
    Inline = 0x20,
    IsOptional = 0x21,
    LowerBound = 0x22,
    Producer = 0x25,
    Prototyped = 0x27,
    ReturnAddr = 0x2A,
    StartScope = 0x2C,
    BitStride = 0x2E,
    UpperBound = 0x2F,
    AbstractOrigin = 0x31,
    Accessibility = 0x32,
    AddressClass = 0x33,
    Artificial = 0x34,
    BaseTypes = 0x35,
    CallingConvention = 0x36,
    Count = 0x37,
    DataMemberLocation = 0x38,
    DeclColumn = 0x39,
    DeclFile = 0x3A,
    DeclLine = 0x3B,
    Declaration = 0x3C,
    DiscrList = 0x3D,
    Encoding = 0x3E,
    External = 0x3F,
    FrameBase = 0x40,
    Friend = 0x41,
    IdentifierCase = 0x42,
    MacroInfo = 0x43,
    NamelistItem = 0x44,
    Priority = 0x45,
    Segment = 0x46,
    Specification = 0x47,
    StaticLink = 0x48,
    Type = 0x49,
    UseLocation = 0x4A,
    VariableParameter = 0x4B,
    Virtuality = 0x4C,
    VtableElemLocation = 0x4D,
    Allocated = 0x4E,
    Associated = 0x4F,
    DataLocation = 0x50,
    ByteStride = 0x51,
    EntryPc = 0x52,
    UseUtf8 = 0x53,
    Extension = 0x54,
    Ranges = 0x55,
    Trampoline = 0x56,
    CallColumn = 0x57,
    CallFile = 0x58,
    CallLine = 0x59,
    Description = 0x5A,
    BinaryScale = 0x5B,
    DecimalScale = 0x5C,
    Small = 0x5D,
    DecimalSign = 0x5E,
    DigitCount = 0x5F,
    PictureString = 0x60,
    Mutable = 0x61,
    ThreadsScaled = 0x62,
    Explicit = 0x63,
    ObjectPointer = 0x64,
    Endianity = 0x65,
    Elemental = 0x66,
    Pure = 0x67,
    Recursive = 0x68,
    Signature = 0x69,
    MainSubprogram = 0x6A,
    DataBitOffset = 0x6B,
    ConstExpr = 0x6C,
    EnumClass = 0x6D,
    LinkageName = 0x6E,
    StringLengthBitSize = 0x6F,
    StringLengthByteSize = 0x70,
    Rank = 0x71,
    StrOffsetsBase = 0x72,
    AddrBase = 0x73,
    RngListsBase = 0x74,
    DwoName = 0x76,
    Reference = 0x77,
    RValueReference = 0x78,
    Macros = 0x79,
    CallAllCalls = 0x7A,
    CallAllSourceCalls = 0x7B,
    CallAllTailCalls = 0x7C,
    CallReturnPC = 0x7D,
    CallValue = 0x7E,
    CallOrigin = 0x7F,
    CallParameter = 0x80,
    CallPC = 0x81,
    CallTailCall = 0x82,
    CallTarget = 0x83,
    CallTargetClobbered = 0x84,
    CallDataLocation = 0x85,
    CallDataValue = 0x86,
    NoReturn = 0x87,
    Alignment = 0x88,
    ExportSymbols = 0x89,
    Deleted = 0x8A,
    Defaulted = 0x8B,
    LocListsBase = 0x8C,
}


export interface AbbreviationAttribute {
    name: AbbreviationAttributeName;
    form: AbbreviationAttributeForm;
}

export interface AbbreviationEntry {
    code: number;
    tag: AbbreviationTag;
    hasChildren: boolean;
    attributes: AbbreviationAttribute[];
}

export interface CompilationUnitHeader {
    version: number;
    abbrevOffset: number;
    addressSize: number;
}

export interface CompilationUnit {
    header: CompilationUnitHeader;
    abbreviations: AbbreviationEntry[];
}

function decodeAbbreviations(buffer: Buffer, elf: ElfHeader, offset: number) {
    const debugAbbrevSectionHeader = elf.elfSectionHeaders.find((section) => getSectionName(buffer, elf, section) == '.debug_abbrev');

    if (!debugAbbrevSectionHeader) return [];

    const abbrevReader = Reader.from(buffer, debugAbbrevSectionHeader.offset + offset);

    const debugAbbrev: AbbreviationEntry[] = [];

    while (abbrevReader.offset < debugAbbrevSectionHeader.offset + debugAbbrevSectionHeader.size) {
        const code = abbrevReader.readULEB128();
        if (code == 0) break;

        const tag: AbbreviationTag = abbrevReader.readULEB128();
        const hasChildren = abbrevReader.readUInt8() == 1 ? true : false;

        const attributes: AbbreviationAttribute[] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const name: AbbreviationAttributeName = abbrevReader.readULEB128();
            const form: AbbreviationAttributeForm = abbrevReader.readULEB128();

            if (name == 0 && form == 0) break;

            attributes.push({ name, form });
        }

        debugAbbrev.push({ code, tag, hasChildren, attributes });
    }


    const debugAbbrevD = debugAbbrev.map(x => ({
        code: x.code,
        tag: AbbreviationTag[x.tag],
        hasChildren: x.hasChildren,
        attributes: x.attributes.map(y => ({
            name: AbbreviationAttributeName[y.name],
            form: AbbreviationAttributeForm[y.form]
        }))
    }));

    console.dir(debugAbbrevD, { depth: null });

    return debugAbbrev;
}

export function decodeDwarf(buffer: Buffer, elf: ElfHeader): Dwarf {
    const debugInfoSectionHeader = elf.elfSectionHeaders.find(x => getSectionName(buffer, elf, x) == ".debug_info");
    const debugAbbrevSectionHeader = elf.elfSectionHeaders.find(x => getSectionName(buffer, elf, x) == ".debug_abbrev");

    if (!debugInfoSectionHeader) throw new Error("No .debug_info section found");
    if (!debugAbbrevSectionHeader) throw new Error("No .debug_abbrev section found");

    debug!(debugInfoSectionHeader, debugAbbrevSectionHeader);

    const infoReader = Reader.from(buffer, debugInfoSectionHeader.offset);

    const compilationUnits: CompilationUnit[] = [];
    while (infoReader.offset < debugInfoSectionHeader.offset + debugInfoSectionHeader.size) {
        const length = infoReader.readUInt32();
        const headerStart = infoReader.offset;

        const version = infoReader.readUInt16();

        if (version !== 5) {
            throw new Error(`Unsupported DWARF version ${version}`);
        }

        infoReader.readUInt8();

        const abbrevOffset = infoReader.readUInt32();
        const addressSize = infoReader.readUInt8();

        const headerEnd = infoReader.offset;
        const headerLength = headerEnd - headerStart;

        const header: CompilationUnitHeader = {
            version,
            abbrevOffset,
            addressSize
        };

        debug!(header);

        const abbreviations = decodeAbbreviations(buffer, elf, abbrevOffset);

        while (infoReader.offset < headerStart + length) {
            const code = infoReader.readULEB128();
            debug!(code);
            if (code == 0) continue;

            // const form = infoReader.readULEB128();
            const abbr = abbreviations.find(x => x.code == code);
            if (!abbr) throw new Error("No abbreviation found");

            debug!(abbr);

            process.exit(0);

            // debug!(code);
        }


        debug!(header);

        compilationUnits.push({
            header,
            abbreviations,
        });
    }

    return {
        compilationUnits,
    };
}
