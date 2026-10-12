import { cn } from "@/shared/helpers";

type ThemedImageProps = {
  src: string;
  darkSrc?: string;
  alt?: string;
  className?: string;
};

export const ThemedImage = ({ src, darkSrc, alt = "", className }: ThemedImageProps) => {
  if (!darkSrc) {
    return <img src={src} alt={alt} className={cn("block", className)} />;
  }

  return (
    <>
      <img src={src} alt={alt} className={cn("block dark:hidden", className)} />
      <img src={darkSrc} alt={alt} className={cn("hidden dark:block", className)} />
    </>
  );
};
