import React, { useState } from "react";
import ConverterTextArea from "./ConverterTextArea";
import { useConverter } from "../hooks/useConverter";

const sampleCaseClass=`
// Copy and paste an object into here
case class SomeObject(
  id: String,
  name: Option[String] = None,
  bool: Option[Boolean] = None,
  float: Float,
  website: Option[Double] = None,
  someInt: Int,
  someLong: Option[Long] = None,
  someListOfOptionalStrings: List[Option[String]]= None,
  anotherOptionalComplexObject: SomeObject,
  anotherOptionalComplexObject: Option[AnotherObject] = None, 
  timeCreated: LocalDateTime,
  timeUpdatedOptional: Option[LocalDateTime]
)
`

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
