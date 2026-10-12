import { STORAGE_KEYS } from "@/shared/constants";
import { createId } from "@/shared/helpers";
import { useLocalStorage } from "@/shared/hooks";
import type { Todo } from "../types";

export const useTodos = () => {
  const todosStorage = useLocalStorage<Todo[]>(STORAGE_KEYS.todos, []);

  const addTodo = (text: string) => {
    const todo: Todo = { id: createId(), text, done: false };
    todosStorage.functions.setValue((prev) => [...prev, todo]);
  };

  const updateTodo = (id: string, text: string) => {
    todosStorage.functions.setValue((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, text } : todo))
    );
  };

  const deleteItem = (id: string) => {
    todosStorage.functions.setValue((prev) => prev.filter((todo) => todo.id !== id));
  };

  const setDone = (id: string) => {
    todosStorage.functions.setValue((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))
    );
  };

  return {
    state: { todos: todosStorage.state.value },
    functions: { addTodo, updateTodo, deleteItem, setDone }
  };
};
