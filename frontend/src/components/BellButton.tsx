import { useReminders } from '@/store/reminders';
import { toast } from '@/store/ui';

export function BellButton({ onInk = false }: { onInk?: boolean }) {
  const enabled = useReminders((s) => s.enabled);
  const setEnabled = useReminders((s) => s.setEnabled);
  if (typeof Notification === 'undefined') return null;

  const toggle = async () => {
    if (enabled) {
      setEnabled(false);
      toast.info('Browser reminders are off');
      return;
    }
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (result === 'granted') {
      setEnabled(true);
      toast.success('You will get a reminder when something is due today or tomorrow');
    } else {
      toast.error('Notifications are blocked. Allow them in your browser settings to use reminders.');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn off browser reminders' : 'Turn on browser reminders'}
      title={enabled ? 'Browser reminders are on' : 'Get browser reminders'}
      className={`rounded-lg px-2.5 py-1 text-lg ${onInk ? 'hover:bg-white/15' : 'hover:bg-surface-2'}`}
    >
      {enabled ? '🔔' : '🔕'}
    </button>
  );
}
