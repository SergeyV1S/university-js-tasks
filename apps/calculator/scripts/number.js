const numberHandler = (number) => {
  const displayNumber = document.querySelector("#display-number");

  if (displayNumber.textContent === "0") {
    displayNumber.textContent = number;
  } else {
    displayNumber.textContent += number;
  }
};

export { numberHandler };
