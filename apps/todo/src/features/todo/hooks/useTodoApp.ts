import type { KeyboardEvent } from "react";
import { isBlank } from "@/shared/helpers";
import { useTaskModal } from "./useTaskModal";
import { useTodos } from "./useTodos";

export const useTodoApp = () => {
  const todoList = useTodos();
  const taskModal = useTaskModal();

  const canSave = !isBlank(taskModal.state.text);

  const createTask = () => {
    todoList.functions.addTodo(taskModal.state.text.trim());
    taskModal.functions.closeModal();
  };

  const editTask = (id: string) => {
    todoList.functions.updateTodo(id, taskModal.state.text.trim());
    taskModal.functions.closeModal();
  };

  const saveTask = () => {
    if (!canSave) return;

    if (taskModal.state.editingId === null) {
      createTask();
    } else {
      editTask(taskModal.state.editingId);
    }
  };

  const handleTaskKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Escape") {
      taskModal.functions.closeModal();
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      saveTask();
    }
  };

  return {
    state: {
      todos: todoList.state.todos,
      hasTodos: todoList.state.todos.length > 0,
      isModalOpen: taskModal.state.isOpen,
      text: taskModal.state.text,
      isEditing: taskModal.state.isEditing,
      canSave
    },
    functions: {
      openModal: taskModal.functions.openModal,
      closeModal: taskModal.functions.closeModal,
      changeText: taskModal.functions.changeText,
      deleteItem: todoList.functions.deleteItem,
      setDone: todoList.functions.setDone,
      saveTask,
      handleTaskKeyDown
    }
  };
};
