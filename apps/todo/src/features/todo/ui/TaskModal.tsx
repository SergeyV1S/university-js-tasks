import type { ChangeEvent, KeyboardEvent } from "react";
import { arrowBackIcon, checkIcon } from "@/shared/assets";
import { useAutoFocus } from "@/shared/hooks";
import { IconButton, Textarea } from "@/shared/ui";

type TaskModalProps = {
  text: string;
  isEditing: boolean;
  canSave: boolean;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSave: () => void;
  onClose: () => void;
};

export const TaskModal = ({
  text,
  isEditing,
  canSave,
  onChange,
  onKeyDown,
  onSave,
  onClose
}: TaskModalProps) => {
  const { state } = useAutoFocus<HTMLTextAreaElement>();

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={isEditing ? "Edit task" : "New task"}
      className='fixed inset-0 z-20 bg-background'
    >
      <div className='mx-auto flex h-full max-w-app flex-col px-[50px] py-10'>
        <header className='flex items-start justify-between'>
          <IconButton icon={arrowBackIcon} label='Back' className='-m-2 p-2' onClick={onClose} />
          <IconButton
            icon={checkIcon}
            label='Save task'
            className='-m-2 p-2'
            disabled={!canSave}
            onClick={onSave}
          />
        </header>

        <Textarea
          ref={state.ref}
          value={text}
          placeholder='Add New Task...'
          aria-label='Task text'
          className='mt-[29px] flex-1'
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
};
