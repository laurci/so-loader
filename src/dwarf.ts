import * as child_process from "child_process";

interface Attribute {
    name: string;
    value: string;
}

interface Item {
    indent: number;
    address: string;
    tag: string;
    attributes: Attribute[];
    children: Item[];
}

function makeAttribute(name: string, value: string): Attribute {
    return {
        name,
        value,
    };
}

function makeItem(indent: number, address: string, tag: string): Item {
    return {
        indent,
        address,
        tag,
        attributes: [],
        children: []
    };
}

class ItemStack {
    private stack: Item[] = [];
    private firstItem: Item | undefined = undefined;

    push(item: Item) {
        if (!this.firstItem) this.firstItem = item;
        this.stack.push(item);
    }

    pop(): Item | undefined {
        return this.stack.pop();
    }

    get current(): Item | undefined {
        return this.stack[this.stack.length - 1];
    }

    get first(): Item | undefined {
        return this.firstItem;
    }
}

export interface ParameterDeclaration {
    name: string;
    type: string;
}

export interface ImplementedFunctionDeclaration {
    name: string;
    parameters: ParameterDeclaration[];
    returnType: string;
}

function findImplementedFunctionDeclarations(root: Item): ImplementedFunctionDeclaration[] {
    const declarations: ImplementedFunctionDeclaration[] = [];

    for (const child of root.children) {
        if (child.tag === "DW_TAG_subprogram") {
            const name = child.attributes.find(x => x.name === "DW_AT_name")?.value;
            if (!name) continue;

            const external = child.attributes.find(x => x.name === "DW_AT_external")?.value;
            const declaration = child.attributes.find(x => x.name === "DW_AT_declaration")?.value;

            if (external !== "yes(1)" || declaration == "yes(1)") continue;

            const returnTypeAddress = child.attributes.find(x => x.name === "DW_AT_type")?.value;
            const returnType = returnTypeAddress ? root.children.find(x => x.address === returnTypeAddress)?.attributes.find(x => x.name === "DW_AT_name")?.value : "void";
            if (!returnType) continue;

            const parameters: ParameterDeclaration[] = [];
            for (const parameter of child.children) {
                if (parameter.tag !== "DW_TAG_formal_parameter") continue;

                const name = parameter.attributes.find(x => x.name === "DW_AT_name")?.value;
                if (!name) continue;

                const typeAddress = parameter.attributes.find(x => x.name === "DW_AT_type")?.value;
                const type = typeAddress ? root.children.find(x => x.address === typeAddress)?.attributes.find(x => x.name === "DW_AT_name")?.value : "void";
                if (!type) continue;

                parameters.push({
                    name,
                    type,
                });
            }

            declarations.push({
                name,
                parameters,
                returnType,
            });
        }
    }

    return declarations;
}

export function readDwarf(filePath: string) {
    const command = `dwarfdump -i ${filePath}`;
    const text = child_process.execSync(command).toString();

    const lines = text.split("\n").map(x => x.trim()).filter(x => x.length > 0);

    const stack = new ItemStack();

    for (const line of lines) {
        const addressMatch = line.match(/<( |[0-9])+><0x[0-9a-fA-F]+> +/ig)?.[0] ?? undefined as string | undefined;
        if (addressMatch) {
            const indent = addressMatch.length;
            const tag = line.substring(addressMatch.length);
            const address = `<${addressMatch.split("<")[2].replace(">", "").trim()}>`;

            const item = makeItem(indent, address, tag);

            if (!stack.current) {
                stack.push(item);
                continue;
            }

            if (item.indent > stack.current.indent) {
                stack.current.children.push(item);
                stack.push(item);
            } else if (item.indent === stack.current.indent) {
                stack.pop();
                stack.current.children.push(item);
                stack.push(item);
            } else {
                while (stack.current?.indent >= item.indent) {
                    stack.pop();
                }

                stack.current?.children.push(item);
                stack.push(item);
            }
        } else {
            const tag = line.match(/DW(_[a-zA-Z0-9]+)+/ig)?.[0] ?? undefined as string | undefined;
            if (!tag) continue;

            const value = line.replace(tag, "").trim();

            stack.current?.attributes.push(makeAttribute(tag, value));
        }
    }

    if (!stack.first) throw new Error("No root item found");

    const declarations = findImplementedFunctionDeclarations(stack.first);
    return declarations;
}
