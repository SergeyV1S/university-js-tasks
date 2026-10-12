export const storage = {
  setItem: <T>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getItem: <T>(key: string) => {
    const rawValue = localStorage.getItem(key);
    if (rawValue === null) return null;

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },

  get length() {
    return localStorage.length;
  }
};
