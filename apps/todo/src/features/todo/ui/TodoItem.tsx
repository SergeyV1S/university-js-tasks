import {
  checkCircleIcon,
  circleDarkIcon,
  circleLightIcon,
  closeIcon,
  editDarkIcon,
  editLightIcon
} from "@/shared/assets";
import { cn } from "@/shared/helpers";
import { IconButton, type IconButtonProps } from "@/shared/ui";
import type { Todo, TodoHandlers } from "../types";

type TodoItemProps = TodoHandlers & {
  todo: Todo;
};

const STATUS_ICONS = {
  done: { icon: checkCircleIcon, label: "Mark as not done" },
  active: { icon: circleLightIcon, darkIcon: circleDarkIcon, label: "Mark as done" }
} satisfies Record<string, Pick<IconButtonProps, "icon" | "darkIcon" | "label">>;

export const TodoItem = ({ todo, onToggle, onEdit, onDelete }: TodoItemProps) => (
  <li className='flex min-h-[52px] items-center gap-gutter rounded-card bg-surface px-gutter py-3'>
    <IconButton
      {...STATUS_ICONS[todo.done ? "done" : "active"]}
      aria-pressed={todo.done}
      className='size-[22px]'
      onClick={() => onToggle(todo.id)}
    />

    <p
      className={cn(
        "min-w-0 flex-1 text-task wrap-break-word whitespace-pre-wrap",
        todo.done ? "font-light text-muted line-through" : "font-normal"
      )}
    >
      {todo.text}
    </p>

    <div className='flex items-center gap-[10px]'>
      <IconButton
        icon={editLightIcon}
        darkIcon={editDarkIcon}
        label='Edit task'
        className='size-6'
        onClick={() => onEdit(todo)}
      />
      <IconButton
        icon={closeIcon}
        label='Delete task'
        className='size-[22px]'
        onClick={() => onDelete(todo.id)}
      />
    </div>
  </li>
);
