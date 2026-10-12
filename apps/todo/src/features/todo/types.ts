export type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoHandlers = {
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
};
