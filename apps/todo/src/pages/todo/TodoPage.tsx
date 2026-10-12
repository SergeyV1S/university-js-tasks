import { ThemeToggle } from "@/features/theme";
import { EmptyState, TaskModal, TodoList, useTodoApp } from "@/features/todo";
import { plusIcon } from "@/shared/assets";
import { IconButton } from "@/shared/ui";

export const TodoPage = () => {
  const { state, functions } = useTodoApp();

  return (
    <>
      <div
        inert={state.isModalOpen}
        className='mx-auto flex min-h-dvh max-w-app flex-col px-gutter pt-[30px] pb-[155px]'
      >
        <main className='flex flex-1 flex-col'>
          {state.hasTodos ? (
            <TodoList
              todos={state.todos}
              onToggle={functions.setDone}
              onEdit={functions.openModal}
              onDelete={functions.deleteItem}
            />
          ) : (
            <EmptyState />
          )}
        </main>

        <footer className='pointer-events-none fixed inset-x-0 bottom-0 flex h-[155px] items-end bg-linear-to-b from-transparent to-background to-72% pb-[50px]'>
          <div className='mx-auto grid w-full max-w-app grid-cols-[1fr_auto_1fr] items-center px-gutter'>
            <IconButton
              icon={plusIcon}
              label='Add task'
              className='pointer-events-auto col-start-2 size-[63px]'
              onClick={() => functions.openModal()}
            />
            <ThemeToggle className='pointer-events-auto justify-self-end' />
          </div>
        </footer>
      </div>

      {state.isModalOpen && (
        <TaskModal
          text={state.text}
          isEditing={state.isEditing}
          canSave={state.canSave}
          onChange={functions.changeText}
          onKeyDown={functions.handleTaskKeyDown}
          onSave={functions.saveTask}
          onClose={functions.closeModal}
        />
      )}
    </>
  );
};
