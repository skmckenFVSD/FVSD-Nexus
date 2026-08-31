import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FVSD_LOGO_URL = 'https://fvsdabca.sharepoint.com/sites/engage/orgimages/FVSDAnalyticsAgent512.png';

interface FvsdLogoProps {
  className?: string;
}

export function FVSDLogo({ className }: FvsdLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
        className,
      )}
      aria-label="FVSD Insights logo"
    >
      {hasError ? (
        <BarChart3 className="h-5 w-5" aria-hidden="true" />
      ) : (
        <img
          src={FVSD_LOGO_URL}
          alt="FVSD Insights"
          className="h-full w-full object-contain"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
