import React from "react";
//import TextareaInput from "./TextAreaInput";

const ConverterTextArea = ({ handleTextChange, text }) => {
  const handleChange = (event) => {
    if (handleTextChange) {
      handleTextChange(event.target.value);
    }
  };
  return (
    <textarea className="Text" onChange={handleChange} value={text} />
  );
};

export default ConverterTextArea;
