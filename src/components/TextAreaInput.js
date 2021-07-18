import React, { useEffect, useState } from "react";

const TextareaInput = ({ spaces = 4, onChange, value, ...props }) => {
  const [text, setText] = useState({ value, caret: -1, target: null });

  useEffect(() => {
    if (text.caret >= 0) {
      text.target.setSelectionRange(text.caret + spaces, text.caret + spaces);
    }
  }, [spaces, text]);

  useEffect(() => {
    onChange({ target: { value: text.value } });
  }, [text.value]);

  useEffect(
    (newValue) => {
      setText({ ...newValue, value });
    },
    [value]
  );
  const handleTab = (e) => {
    let content = e.target.value;
    let caret = e.target.selectionStart;

    if (e.key === "Tab") {
      e.preventDefault();

      if (!e.shiftKey) {
        let newText =
          content.substring(0, caret) +
          " ".repeat(spaces) +
          content.substring(caret);

        setText({ value: newText, caret: caret, target: e.target });
      }
    } else {
      setText({ value: e.target.value, caret: caret, target: e.target });
    }
  };

  const handleText = (e) =>
    setText({ value: e.target.value, caret: -1, target: e.target });

  return (
    <textarea
      {...props}
      onChange={handleText}
      onKeyDown={handleTab}
      value={text.value}
    />
  );
};

export default TextareaInput;
