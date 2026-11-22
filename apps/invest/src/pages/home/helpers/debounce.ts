export const debounce = <Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => clearTimeout(timeout);
  const schedule = (...args: Args) => {
    cancel();
    timeout = setTimeout(() => callback(...args), delayMs);
  };

  return Object.assign(schedule, { cancel });
};
