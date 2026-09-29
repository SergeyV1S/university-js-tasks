import storage from "./localStorage.js";

const memoryHandler = (command, value) => {
  const savedValue = Number(storage.read());

  switch (command) {
    case "M+":
      return memoryPlus(savedValue);
    case "M-":
      return memoryMinus(savedValue);
    case "MR":
      return memoryRead();
    case "MS":
      return memorySave(value);
    case "MC":
      return memoryClear();
  }
};

const memoryPlus = (savedValue) => {
  const displayNumber = document.querySelector("#display-number");
  const currentValue = Number(displayNumber.textContent);

  if (!currentValue) {
    return;
  }

  storage.write(currentValue + savedValue);
};

const memoryMinus = (savedValue) => {
  const displayNumber = document.querySelector("#display-number");
  const currentValue = Number(displayNumber.textContent);

  if (!currentValue) {
    return;
  }

  storage.write(savedValue - currentValue);
};

const memoryRead = (savedValue) => {
  const displayNumber = document.querySelector("#display-number");

  displayNumber.textContent = savedValue || 0;
};

const memorySave = (value) => {
  if (!value) {
    return;
  }

  storage.write(value);
};

const memoryClear = () => storage.delete();

export { memoryHandler };
