import calculator from "../calculator.js";
import storage from "./localStorage.js";

const memoryHandler = (command) => {
  const savedValue = Number(storage.read());

  switch (command) {
    case "M+":
      return memoryPlus(savedValue);
    case "M-":
      return memoryMinus(savedValue);
    case "MR":
      return memoryRead(savedValue);
    case "MS":
      return memorySave();
    case "MC":
      return memoryClear();
  }
};

const memoryPlus = (savedValue) => {
  const currentValue = calculator.value;

  if (!currentValue) {
    return;
  }

  storage.write(currentValue + savedValue);
};

const memoryMinus = (savedValue) => {
  const currentValue = calculator.value;

  if (!currentValue) {
    return;
  }

  storage.write(savedValue - currentValue);
};

const memoryRead = (savedValue) => {
  calculator.value = savedValue;
};

const memorySave = () => {
  const value = calculator.value;

  if (!value) {
    return;
  }

  storage.write(value);
};

const memoryClear = () => storage.delete();

export { memoryHandler };
