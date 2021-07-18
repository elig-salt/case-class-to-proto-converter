import React, { useState } from "react";
import ConverterTextArea from "./ConverterTextArea";
import { useConverter } from "../hooks/useConverter";

const sampleCaseClass=`case class User(id: String)`

const Converter = () => {
  const [textStateFrom, setTextStateFrom] = useState(sampleCaseClass);
  const { converted } = useConverter(textStateFrom);

  return (
    <div className="Wrapper">
      <ConverterTextArea
        text={textStateFrom}
        handleTextChange={setTextStateFrom}
      />
      <button className="Convert-button">Convert</button>
      <ConverterTextArea
        text={converted}
      />
    </div>
  );
};
export default Converter;
