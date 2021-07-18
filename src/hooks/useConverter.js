import { useEffect, useState } from "react";
import { snakeCase } from "change-case";

const INVALID_INPUT = "Invalid input";
const messageNameRegex = /^case class\s*(.+)\(/g;
const paramsRegex = /(\(.*\))/g;

const primitiveTypesMap = new Map([
  ["Double", { normal: "double", optional: "google.protobuf.DoubleValue" }],
  ["Float", { normal: "float", optional: "google.protobuf.FloatValue" }],
  ["Long", { normal: "int64", optional: "google.protobuf.Int64Value" }],
  ["Int", { normal: "int32", optional: "google.protobuf.Int32Value" }],
  ["Boolean", { normal: "bool", optional: "google.protobuf.BoolValue" }],
  ["String", { normal: "string", optional: "google.protobuf.StringValue" }],
  ["ByteString", { normal: "bytes", optional: "google.protobuf.BytesValue" }],
]);

const nonPimitiveTypesMap = new Map([
  ["LocalDateTime", "common.time.Timestamp"],
]);

export function useConverter(text) {
  const [state, setState] = useState("");

  useEffect(() => {
    let newState = "";

    const cleaned = cleanText(text);
    const inputItems = cleaned
      .split("case class")
      .filter((item) => item.trim() !== "" && !item.startsWith("//"))
      .map((item) => {
        return `case class ${item.trim()}`;
      });

    for (const item of inputItems) {
      const result = convertSingleScalaCaseClassToProto(item.trim());
      if (!item) {
        newState = INVALID_INPUT;
        break;
      }
      newState += `\n${result}`;
    }

    setState(newState.trim());
  }, [text]);

  return { converted: state };
}

function convertSingleScalaCaseClassToProto(text) {
  const genericObject = buildGenericObject(text);
  if (!genericObject) {
    return null;
  }
  return genericObjectToProto(genericObject);
}

function convertScalaToProtoParamType(type) {
  let input = type.replaceAll(/=.*/g, "");
  let hasOption = false;
  let hasList = false;
  if (input.includes("Option[")) {
    hasOption = true;
  }
  if (input.includes("List[")) {
    hasList = true;
  }

  input = input
    .replaceAll("Option[", "")
    .replaceAll("List[", "")
    .replaceAll("]", "")
    .trim();

  const mappedType = primitiveTypesMap.get(input);
  if (mappedType) {
    const { normal, optional } = mappedType;
    return {
      prefix: `${hasList ? "repeated " : ""}${hasOption ? optional : normal}`,
      suffix: null,
    };
  } else {
    let nonPrimitiveType = nonPimitiveTypesMap.get(input) || input;
    return {
      prefix: `${hasList ? "repeated " : ""}${nonPrimitiveType}`,
      suffix: hasOption ? "[(scalapb.field).no_box = true]" : null,
    };
  }
}

function convertParams(params) {
  if (!params || !params.length) {
    return [];
  }
  return params
    .map(({ key, val }, index) => {
      const formattedKey = snakeCase(key);
      const paramType = convertScalaToProtoParamType(val);

      let result = `  ${paramType.prefix} ${formattedKey} = ${index + 1}`;
      if (paramType.suffix) {
        result += ` ${paramType.suffix}`;
      }
      result += ";";
      return result;
    })
    .filter((item) => item);
}

function genericObjectToProto(genericObject) {
  const result = [];
  const convertedParams = convertParams(genericObject.params);
  result.push(`message ${genericObject.messageName} {`);
  if (!convertParams.length) {
    result[0] += "}";
  } else {
    result.push(...convertedParams);
    result.push("}");
  }
  return result.join("\n");
}

function buildGenericObject(text) {
  let result = null;

  if (text !== "") {
    const messageName = extractMessageName(text);
    if (!messageName) return null;
    result = {
      messageName,
      params: [],
    };
    const params = extractParams(text);
    if (params) {
      const afterSplit = splitParams(params);
      if (afterSplit.length) {
        result.params = afterSplit;
      }
    }
  }

  return result;
}

function splitParams(params) {
  return params
    .split(",")
    .map((p) => {
      const [key, val] = p.replaceAll(" ", "").split(":");
      if (!key || !val) return null;
      return { key, val };
    })
    .filter((item) => item !== null);
}

function extractParams(text) {
  const matches = Array.from(text.matchAll(paramsRegex));
  if (!matches.length) {
    return null;
  }
  const firstGroup = matches[0];
  if (!firstGroup.length) {
    return null;
  }

  return firstGroup[1].replaceAll("(", "").replaceAll(")", "");
}

function extractMessageName(text) {
  const matches = Array.from(text.matchAll(messageNameRegex));
  if (!matches.length) {
    return null;
  }
  const firstGroup = matches[0];
  if (!firstGroup.length) {
    return null;
  }

  return firstGroup[1];
}

function cleanText(text) {
  if (!text) return text;
  return text.trim().replaceAll("\n", "");
}
