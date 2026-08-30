export function formatRelativeTime(value: string | number, now: Date = new Date()): string {
  const time = new Date(value);
  const diffMs = now.getTime() - time.getTime();

  if (Number.isNaN(time.getTime()) || diffMs < 0) return 'now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;

  return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}