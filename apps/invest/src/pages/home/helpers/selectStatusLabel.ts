import { formatTime } from "@/shared/helpers/format";

export const selectStatusLabel = (
  refreshing: boolean,
  stale: boolean,
  hasError: boolean,
  updatedAt?: number | null
) => {
  if (stale) return "Могут быть устаревшими";
  if (refreshing) return "Обновляем котировки…";
  if (hasError) return "Обновление приостановлено";
  if (updatedAt != null) return `Обновлено в ${formatTime(updatedAt)}`;
  return "Загрузка котировок…";
};
