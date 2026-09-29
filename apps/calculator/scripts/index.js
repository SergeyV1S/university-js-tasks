import { memoryHandler } from "./memory.js";

const keyboardElement = document.querySelector("#keyboard");

const numberHandler = (number) => {
  console.log(number, typeof number);
};

const operationsHandler = (operation) => {
  console.log(operation);
};

keyboardElement.addEventListener("click", (event) => {
  const { id: elementId, textContent } = event.target;

  if (elementId === "keyboard") {
    return;
  }

  if (!elementId) {
    numberHandler(Number(textContent));
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
