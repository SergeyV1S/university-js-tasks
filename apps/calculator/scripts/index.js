import { memoryHandler } from "./memory.js";
import { numberHandler } from "./number.js";

const keyboardElement = document.querySelector("#keyboard");

const operationsHandler = (operation) => {
  console.log(operation);
};

keyboardElement.addEventListener("click", (event) => {
  const { id: elementId, textContent } = event.target;

  if (elementId === "keyboard") {
    return;
  }

  if (!elementId) {
    numberHandler(textContent);
    return;
  }

  if (elementId.startsWith("memory")) {
    memoryHandler(textContent);
    return;
  }

  if (elementId === "comma") {
    console.log("comma");
    return;
  }

  operationsHandler(textContent);
});
