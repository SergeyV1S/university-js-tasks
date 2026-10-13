import type { ComponentProps } from "react";
import { clearIcon, searchIcon } from "@/shared/assets";
import { cn } from "@/shared/helpers";
import { IconButton } from "./IconButton";

type SearchInputProps = Omit<ComponentProps<"input">, "type"> & {
  onClear: () => void;
};

export const SearchInput = ({ value, onClear, className, ...props }: SearchInputProps) => (
  <div
    className={cn(
      "flex items-start gap-3 border-b-2 border-muted pb-[17px] focus-within:border-accent",
      className
    )}
  >
    <img src={searchIcon} alt='' className='mt-[5px] ml-0.5 block' />
    <input
      type='search'
      value={value}
      className='min-w-0 flex-1 bg-transparent text-search outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden'
      {...props}
    />
    <IconButton
      icon={clearIcon}
      label='Очистить поиск'
      disabled={value === ""}
      className='-mr-1 -mb-1.5 -ml-1.5 p-1.5 disabled:cursor-default disabled:hover:opacity-100'
      onClick={onClear}
    />
  </div>
);
