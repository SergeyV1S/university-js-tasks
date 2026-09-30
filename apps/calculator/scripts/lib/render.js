import calculator from "../calculator.js";

const displayElement = document.querySelector("#display");
const displayNumberElement = document.querySelector("#display-number");

const render = () => {
  displayElement.textContent = calculator.expression;
  displayElement.classList.toggle("display-hide", !calculator.expression);
  displayNumberElement.textContent = calculator.current;
};

export { render };
