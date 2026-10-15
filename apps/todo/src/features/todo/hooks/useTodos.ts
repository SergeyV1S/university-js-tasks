import { createId } from "@/shared/helpers";
import type { Todo } from "../types";
import { useTodoState } from "./useTodoState";

export const useTodos = () => {
  const todoState = useTodoState();

  const addTodo = (text: string) => {
    const todo: Todo = { id: createId(), text, done: false };
    todoState.functions.setTodos((prev) => [...prev, todo]);
  };

  const updateTodo = (id: string, text: string) => {
    todoState.functions.setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, text } : todo))
    );
  };

  const deleteItem = (id: string) => {
    todoState.functions.setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const setDone = (id: string) => {
    todoState.functions.setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))
    );
  };

  return {
    state: { todos: todoState.state.todos },
    functions: { addTodo, updateTodo, deleteItem, setDone }
  };
};
