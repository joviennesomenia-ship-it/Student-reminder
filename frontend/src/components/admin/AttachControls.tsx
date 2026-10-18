import { useRef, useState } from 'react';
import { toast } from '@/store/ui';
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_MB, checkClientFile } from '@/utils/files';
import { Button } from '../ui/Button';
import { controlClass } from '../ui/Fields';

interface Props {
  onFiles: (files: File[]) => void;
  onLink: (name: string, url: string) => void;
  disabled?: boolean;
}

/** "Choose files" and "Add a link" controls, shared by the new-item and edit-item forms. */
export function AttachControls({ onFiles, onLink, disabled }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const pick = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    for (const f of Array.from(list)) {
      const problem = checkClientFile(f);
      if (problem) toast.error(problem);
      else ok.push(f);
    }
    if (ok.length) onFiles(ok);
  };

  const addLink = () => {
    const raw = url.trim();
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      new URL(normalized);
    } catch {
      toast.error('That link does not look right. Paste the full address, for example https://drive.google.com/...');
      return;
    }
    onLink(name.trim() || normalized, normalized);
    setName('');
    setUrl('');
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          aria-label="Choose files"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
        <Button variant="secondary" small disabled={disabled} onClick={() => fileInput.current?.click()}>
          ⬆️ Choose files
        </Button>
        <span className="text-xs text-muted">PDF, Word, PowerPoint, Excel, TXT or images, up to {MAX_UPLOAD_MB} MB each</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input className={controlClass} placeholder="Link name (optional)" aria-label="Link name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={controlClass} placeholder="https://drive.google.com/..." aria-label="Link address" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button small disabled={disabled || !url.trim()} onClick={addLink}>
          Add link
        </Button>
      </div>
    </div>
  );
}
