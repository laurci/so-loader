import { FunctionMacro, IntrinsicTypes, isStringLiteral } from "compiler";
import * as path from "path";
import { createInjectorExpression } from "@laurci/injector/lib/utils";
import { ImplementedFunctionDeclaration, readDwarf } from "./dwarf";

const declarationsMap = new Map<string, ImplementedFunctionDeclaration[]>();

function cTypeToIntrinsicType(cType: string): IntrinsicTypes {
    switch (cType) {
        case "void":
            return IntrinsicTypes.Void;
        case "int":
            return IntrinsicTypes.Number;
        default:
            return IntrinsicTypes.Any;
    }
}

export macro function so(this: FunctionMacro, _filePath: string) {
    this.transform(({ node, factory, sourceFile }) => {

        const filePathArg = node.arguments[0]!;
        if (!isStringLiteral(filePathArg)) {
            throw new Error("Expected a string literal as the first argument");
        }

        const filePath = path.join(path.dirname(sourceFile.fileName), filePathArg.text);

        const declarations = declarationsMap.has(filePath) ? declarationsMap.get(filePath)! : readDwarf(filePath);
        declarationsMap.set(filePath, declarations);

        node.replace(
            factory.createCallExpression(
                createInjectorExpression(factory, "so"),
                [],
                [
                    factory.createIdentifier("__dirname"),
                    factory.createStringLiteral(filePathArg.text),
                    factory.createStringLiteral(JSON.stringify(declarations)),
                ]
            )
        );
    });

    this.check(({ node, factory, diagnostic, sourceFile }) => {
        const filePathArg = node.arguments[0];
        if (!filePathArg || !isStringLiteral(filePathArg)) {
            diagnostic("error", "Expected a string literal as the first argument", filePathArg);
            return factory.createIntrinsicDefinition(IntrinsicTypes.Never);
        }

        const filePath = path.join(path.dirname(sourceFile.fileName), filePathArg.text);

        const declarations = declarationsMap.has(filePath) ? declarationsMap.get(filePath)! : readDwarf(filePath);
        declarationsMap.set(filePath, declarations);

        const returnType = factory.createObjectDefinition([]);
        for (const declaration of declarations) {
            const parameters = factory.createObjectDefinition(
                declaration.parameters.map(param => {
                    return factory.createObjectMemberDefinition(param.name, factory.createIntrinsicDefinition(cTypeToIntrinsicType(param.type)))
                })
            );

            const decl = factory.createObjectDefinition([
                factory.createObjectMemberDefinition("parameters", parameters),
                factory.createObjectMemberDefinition("returnType", factory.createIntrinsicDefinition(cTypeToIntrinsicType(declaration.returnType))),
            ]);

            returnType.members.push(factory.createObjectMemberDefinition(declaration.name, decl));
        }

        return returnType;
    });
}
