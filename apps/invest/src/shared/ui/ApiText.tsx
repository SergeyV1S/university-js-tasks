export const ApiText = ({ value }: { value: string }) => (
  <span ref={(element) => {
    if (element) element.textContent = value;
  }} />
);
