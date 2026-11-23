import { formatTime } from "../../../shared/helpers/format";

export const selectStatusLabel = (
  refreshing?: boolean,
  hasError?: boolean,
  updatedAt?: number | null
) => {
  if (refreshing) {
    return "Обновляем котировки…";
  }

  if (hasError) {
    return "Обновление приостановлено";
  }

  if (updatedAt) {
    return `Обновлено в ${formatTime(updatedAt)}`;
  }

  return "Загрузка котировок…";
};
