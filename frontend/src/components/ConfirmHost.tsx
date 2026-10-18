import { useConfirm } from '@/store/admin';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function ConfirmHost() {
  const pending = useConfirm((s) => s.pending);
  const answer = useConfirm((s) => s.answer);
  return (
    <Modal open={pending !== null} onClose={() => answer(false)} title={pending?.title ?? ''}>
      <p className="text-sm text-muted">{pending?.body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => answer(false)}>
          Keep it
        </Button>
        <Button variant="danger" onClick={() => answer(true)}>
          {pending?.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
