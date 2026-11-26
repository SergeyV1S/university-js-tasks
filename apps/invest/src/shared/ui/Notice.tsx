import { Banner } from "./Banner";
import { Button } from "./Button";
import { Icon } from "./Icon";

type NoticeProps = {
  title: string;
  detail?: string;
  className?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
};

export const Notice = ({ title, detail, className = "", onDismiss, onRetry }: NoticeProps) => (
  <Banner
    role='alert'
    className={`relative flex min-h-18.5 items-start gap-2.25 px-3 pt-2.75 pb-2.5 ${onDismiss ? "pr-12" : ""} ${className}`}
  >
    <Icon name='alert' className='mt-0.5 size-4.5 shrink-0' />
    <div>
      <p className='text-invest-label'>{title}</p>
      {detail && <p className='mt-0.75 text-invest-caption text-invest-foreground'>{detail}</p>}
      {onRetry && (
        <button
          type='button'
          className='mt-1 cursor-pointer rounded-sm text-invest-caption text-invest-foreground underline'
          onClick={onRetry}
        >
          Повторить запрос
        </button>
      )}
    </div>
    {onDismiss && (
      <Button
        variant='ghost'
        aria-label='Закрыть уведомление'
        className='absolute top-0 right-0 h-11 w-10.75'
        onClick={onDismiss}
      >
        <Icon name='close' />
      </Button>
    )}
  </Banner>
);
