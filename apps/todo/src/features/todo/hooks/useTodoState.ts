import { useState } from "react";
import { STORAGE_KEYS } from "@/shared/constants";
import { usePageLeave } from "@/shared/hooks";
import { storage } from "@/shared/utils";
import type { Todo } from "../types";

export const useTodoState = () => {
  const [todos, setTodos] = useState<Todo[]>(
    () => storage.getItem<Todo[]>(STORAGE_KEYS.todos) ?? []
  );

  usePageLeave(() => {
    storage.setItem(STORAGE_KEYS.todos, todos);
  });

  return {
    state: { todos },
    functions: { setTodos }
  };
};
