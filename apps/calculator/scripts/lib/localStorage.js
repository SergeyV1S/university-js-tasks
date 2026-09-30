const MEMORY_KEY = "calculator-memory";

class Storage {
  read = () => localStorage.getItem(MEMORY_KEY);

  write = (value) => localStorage.setItem(MEMORY_KEY, value);

  delete = () => localStorage.removeItem(MEMORY_KEY);
}

export default new Storage();
