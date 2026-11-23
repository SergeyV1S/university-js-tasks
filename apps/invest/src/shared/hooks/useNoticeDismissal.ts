import { useLayoutEffect, useState } from "react";

export const useNoticeDismissal = (kind: string | undefined) => {
  const [dismissed, setDismissed] = useState<string>();

  useLayoutEffect(() => {
    if (!kind) setDismissed(undefined);
  }, [kind]);

  const dismiss = () => setDismissed(kind);
  return { visible: kind !== undefined && dismissed !== kind, dismiss };
};
