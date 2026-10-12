export const STORAGE_KEYS = {
  todos: "todos",
  theme: "theme"
} as const;

export const THEMES = {
  light: "light",
  dark: "dark"
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];
