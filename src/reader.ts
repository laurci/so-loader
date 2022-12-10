import { debug } from "utils/debug";

export class Reader {

    private data: Uint8Array;

    protected constructor(
        private buffer: Buffer,
        public offset: number = 0
    ) {
        this.data = new Uint8Array(buffer);
    }

    public static from(buffer: Buffer, offset?: number) {
        return new Reader(buffer, offset);
    }

    public setOffset(offset: number) {
        this.offset = offset;
    }

    public readUInt8() {
        const value = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readUInt16() {
        const value = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    public readUInt32() {
        const value = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    public readUInt64() {
        const value = this.buffer.readBigUInt64LE(this.offset);
        this.offset += 8;
        return Number(value);
    }

    public readUint8Array(length: number) {
        const value = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }

    public readULEB128() {
        let result = 0;
        let shift = 0;
        let byte;

        do {
            byte = this.readUInt8();
            result |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);

        return result;
    }

}
