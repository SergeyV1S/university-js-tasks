import { toggleTheme, useTheme } from "./theme";
import { Button, Icon } from "../ui";

export const ThemeToggle = () => {
  const light = useTheme() === "light";

  return (
    <Button
      variant={light ? "selected" : "secondary"}
      aria-label='Светлая тема'
      aria-pressed={light}
      title={light ? "Включить тёмную тему" : "Включить светлую тему"}
      className='size-11'
      onClick={toggleTheme}
    >
      <Icon name={light ? "moon" : "sun"} />
    </Button>
  );
};
