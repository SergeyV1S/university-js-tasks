import { arrowBackIcon } from "@/shared/assets";
import { IconButton } from "./IconButton";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export const ScreenHeader = ({ title, onBack }: ScreenHeaderProps) => (
  <header className='relative flex h-[84px] shrink-0 items-center justify-center pb-1 short:h-[60px]'>
    {onBack && (
      <IconButton
        icon={arrowBackIcon}
        label='Назад'
        className='absolute left-0 p-2.5'
        onClick={onBack}
      />
    )}
    <h1 className='text-title font-medium'>{title}</h1>
  </header>
);
