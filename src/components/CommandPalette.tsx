import { useEffect } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';

export interface PaletteCommand {
  id: string;
  label: string;
  icon?: React.ReactNode;
  group: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: PaletteCommand[];
}

export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  // ⌘K / Ctrl+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const groups = Array.from(new Set(commands.map(c => c.group)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        <Command
          className="rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Type a command..."
              className="w-full py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {groups.map(group => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {commands.filter(c => c.group === group).map(cmd => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => { cmd.onSelect(); onOpenChange(false); }}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-foreground cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                  >
                    {cmd.icon && <span className="w-4 h-4 text-muted-foreground">{cmd.icon}</span>}
                    {cmd.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
