import { moonIcon, sunIcon } from "@/shared/assets";
import { cn } from "@/shared/helpers";
import { IconButton } from "@/shared/ui";
import { useTheme } from "../hooks/useTheme";

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { state, functions } = useTheme();

  return (
    <IconButton
      icon={moonIcon}
      darkIcon={sunIcon}
      label='Dark theme'
      aria-pressed={state.isDark}
      className={cn("size-10", className)}
      onClick={functions.toggleTheme}
    />
  );
};
