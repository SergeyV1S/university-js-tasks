import { useState, type ChangeEvent } from "react";
import type { Todo } from "../types";

export const useTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const openModal = (task?: Todo) => {
    setEditingId(task?.id ?? null);
    setText(task?.text ?? "");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setText("");
    setEditingId(null);
  };

  const changeText = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return {
    state: { isOpen, text, editingId, isEditing: editingId !== null },
    functions: { openModal, closeModal, changeText }
  };
};
