import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/** Format current real date for MMO display */
export function formatGameDate(style: 'short' | 'full' = 'short'): string {
  const now = new Date();
  if (style === 'full') {
    return format(now, 'd MMMM yyyy', { locale: nl });
  }
  // Short: "28 Feb" style
  return format(now, 'd MMM', { locale: nl });
}

/** Format time for display */
export function formatGameTime(): string {
  return format(new Date(), 'HH:mm');
}
