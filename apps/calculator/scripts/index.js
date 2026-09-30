import calculator from "./calculator.js";
import { memoryHandler, render } from "./lib/index.js";

const keyboardElement = document.querySelector("#keyboard");

const clickHandler = (elementId, textContent) => {
  if (!elementId) {
    return calculator.inputDigit(textContent);
  }

  if (elementId.startsWith("memory")) {
    return memoryHandler(textContent);
  }

  if (elementId === "comma") {
    return calculator.inputComma();
  }

  switch (textContent) {
    case "=":
      return calculator.equal();
    case "AC":
      return calculator.clear();
    case "%":
      return calculator.percent();
    default:
      return calculator.setOperator(textContent);
  }
};

keyboardElement.addEventListener("click", (event) => {
  const { id: elementId, textContent } = event.target;

  if (elementId === "keyboard") {
    return;
  }

  clickHandler(elementId, textContent);
  render();
});
