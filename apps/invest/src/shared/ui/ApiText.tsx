import { useApiText } from "../hooks/useApiText";

export const ApiText = ({ value }: { value: string }) => {
  const setTextContent = useApiText(value);
  return <span ref={setTextContent} />;
};
