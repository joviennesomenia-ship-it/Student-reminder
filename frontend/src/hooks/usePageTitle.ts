import { useEffect } from 'react';
import { siteConfig } from '@/config';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;
  }, [title]);
}
