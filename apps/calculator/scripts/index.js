import calculator from "./calculator.js";
import { memoryHandler, render } from "./lib/index.js";
import { VALID_KEYBOARD_KEYS } from "./constants/index.js";

const keyboardElement = document.querySelector("#keyboard");

const inputHandler = (command) => {
  if (!command || /^\d$/.test(key)) {
    return calculator.inputDigit(command);
  }

  if (command.startsWith("M")) {
    return memoryHandler(command);
  }

  if (command === ",") {
    return calculator.inputComma();
  }

  switch (command) {
    case "Enter":
    case "=":
      return calculator.equal();
    case "Delete":
      return calculator.clear();
    case "%":
      return calculator.percent();
    default:
      return calculator.setOperator(command);
  }
};

keyboardElement.addEventListener("click", (event) => {
  const { id: elementId, value, textContent } = event.target;

  if (elementId === "keyboard") {
    return;
  }

  inputHandler(value, textContent);
  render();
});

document.addEventListener("keypress", (event) => {
  const key = event.key;

  if (!VALID_KEYBOARD_KEYS.includes(key) && !/^\d$/.test(key)) {
    return;
  }

  event.preventDefault();
  inputHandler(key, key);
  render();
});
