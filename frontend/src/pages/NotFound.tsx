import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="py-16 text-center">
      <div className="text-6xl" aria-hidden="true">🧭</div>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted">That link does not lead anywhere. It may have been typed wrong or moved.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button>🏠 Go to the home page</Button>
      </Link>
    </div>
  );
}
