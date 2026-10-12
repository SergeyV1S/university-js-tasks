import { emptyDarkImage, emptyLightImage } from "@/shared/assets";
import { ThemedImage } from "@/shared/ui";

export const EmptyState = () => (
  <div className='flex flex-1 flex-col items-center justify-center gap-gutter pt-16'>
    <ThemedImage
      src={emptyLightImage}
      darkSrc={emptyDarkImage}
      className='h-[248px] w-[271px] object-cover dark:opacity-80'
    />
    <p className='text-hint font-light'>Add a task to get started</p>
  </div>
);
