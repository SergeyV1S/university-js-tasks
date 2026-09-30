import { ERROR_TEXT, OPERATIONS } from "./constants/index.js";
import { toNumber, toTextWithPrecision } from "./helpers/index.js";

class Calculator {
  previous = null;
  operator = null;
  current = "0";
  expression = "";
  isNewInput = false;

  get value() {
    return toNumber(this.current);
  }

  set value(number) {
    this.current = toTextWithPrecision(number);
    this.isNewInput = true;
  }

  inputDigit = (digit) => {
    if (this.isNewInput || this.current === "0") {
      this.startInput(digit);
      return;
    }

    this.current += digit;
  };

  inputComma = () => {
    if (this.isNewInput) {
      this.startInput("0,");
      return;
    }

    if (!this.current.includes(",")) {
      this.current += ",";
    }
  };

  setOperator = (operator) => {
    if (this.current === ERROR_TEXT) {
      return;
    }

    if (this.operator && !this.isNewInput) {
      this.calculate();
    }

    if (this.current === ERROR_TEXT) {
      return;
    }

    this.previous = this.value;
    this.operator = operator;
    this.expression = `${toTextWithPrecision(this.previous)} ${operator}`;
    this.isNewInput = true;
  };

  equal = () => {
    if (!this.operator) {
      return;
    }

    this.expression = `${toTextWithPrecision(this.previous)} ${this.operator} ${this.current} =`;
    this.calculate();
  };

  percent = () => {
    if (this.current === ERROR_TEXT) {
      return;
    }

    this.value = this.value / 100;
  };

  clear = () => {
    this.previous = null;
    this.operator = null;
    this.current = "0";
    this.expression = "";
    this.isNewInput = false;
  };

  calculate() {
    const result = OPERATIONS[this.operator](this.previous, this.value);

    this.previous = null;
    this.operator = null;

    if (!Number.isFinite(result)) {
      this.current = ERROR_TEXT;
      this.isNewInput = true;
      return;
    }

    this.value = result;
  }

  startInput(text) {
    if (this.isNewInput && !this.operator) {
      this.expression = "";
    }

    this.current = text;
    this.isNewInput = false;
  }
}

export default new Calculator();
