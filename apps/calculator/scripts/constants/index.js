const OPERATIONS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b
};

const OPERATION_SYMBOLS = {
  "+": "+",
  "-": "-",
  "*": "×",
  "/": "÷"
};

const ERROR_TEXT = "Ошибка";

const VALID_KEYBOARD_KEYS = ["+", "-", "*", "/", "%", ",", "=", "Enter", "Delete"];

export { ERROR_TEXT, OPERATIONS, OPERATION_SYMBOLS, VALID_KEYBOARD_KEYS };
