import type { Todo, TodoHandlers } from "../types";
import { TodoItem } from "./TodoItem";

type TodoListProps = TodoHandlers & {
  todos: Todo[];
};

export const TodoList = ({ todos, onToggle, onEdit, onDelete }: TodoListProps) => (
  <ul className='flex flex-col gap-gutter'>
    {todos.map((todo) => (
      <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </ul>
);
