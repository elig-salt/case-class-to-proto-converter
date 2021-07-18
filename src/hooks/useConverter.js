import { useEffect, useState } from "react";

const INVALID_INPUT = "Invalid input";
const messageNameRegex = /^case class\s*(.+)\(/g;
const paramsRegex = /(\(.*\))/g;

const typeMap = new Map([
  ["String", "string"],
  ["Boolean", "bool"],
]);

export function useConverter(text) {
  const [state, setState] = useState("");

  useEffect(() => {
    let newState = "";

    const cleaned = cleanText(text);
    const inputItems = cleaned.split("case class")
    .filter(item => item.trim() !== "")
    .map(item => {
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

    setState(newState);
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
  if (type.includes("Option[")) {
    hasOption = true;
    input = type.replaceAll("Option[", "").replaceAll("]", "");
  } else if (type.includes("List[")) {
    hasList = true;
    input = type.replaceAll("List[", "").replaceAll("]", "");
  }
  const mappedType = typeMap.get(input.trim());
  if (!mappedType) return null;
  return {
    prefix: `${hasList ? "repeated " : ""}${mappedType}`,
    suffix: hasOption ? null : "[(scalapb.field).no_box = true]",
  };
}

function convertParams(params) {
  if (!params || !params.length) {
    return [];
  }
  return params
    .map(({ key, val }, index) => {
      const paramType = convertScalaToProtoParamType(val);
      if (!paramType) return null;
      let result = `  ${paramType.prefix} ${key} = ${index + 1}`;
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
