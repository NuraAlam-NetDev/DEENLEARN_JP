import Button from './Button.jsx';
import Icon from './Icon.jsx';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <Icon name="chevron-left" className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-slate-600">
        Page {page} of {pages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
        <Icon name="chevron-right" className="h-4 w-4" />
      </Button>
    </nav>
  );
}
