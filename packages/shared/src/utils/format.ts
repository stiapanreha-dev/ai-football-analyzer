/**
 * Утилиты форматирования
 */

/**
 * Форматировать дату для отображения
 */
export function formatDate(date: Date | string, locale = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Форматировать дату и время
 */
export function formatDateTime(date: Date | string, locale = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматировать относительное время (например, "2 часа назад")
 */
export function formatRelativeTime(date: Date | string, locale = 'ru-RU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDay > 0) {
    return rtf.format(-diffDay, 'day');
  }
  if (diffHour > 0) {
    return rtf.format(-diffHour, 'hour');
  }
  if (diffMin > 0) {
    return rtf.format(-diffMin, 'minute');
  }
  return rtf.format(-diffSec, 'second');
}

/**
 * Форматировать оценку архетипа (0-10)
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Форматировать процент
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Форматировать длительность в секундах
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs} сек`;
  }
  if (secs === 0) {
    return `${mins} мин`;
  }
  return `${mins} мин ${secs} сек`;
}

/**
 * Форматировать PIN-код с пробелами для читаемости
 */
export function formatPinCode(code: string): string {
  return code.replace(/(\d{3})(\d{3})/, '$1 $2');
}

/**
 * Форматировать позицию игрока на русском
 */
export function formatPosition(
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | null
): string {
  const positions: Record<string, string> = {
    goalkeeper: 'Вратарь',
    defender: 'Защитник',
    midfielder: 'Полузащитник',
    forward: 'Нападающий',
  };
  return position ? positions[position] ?? position : 'Не указана';
}
