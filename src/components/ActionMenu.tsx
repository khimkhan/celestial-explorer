import { useEffect, useRef, useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  to?: LinkProps['to'];
  active?: boolean;
}

interface Props {
  items: ActionMenuItem[];
  label?: string;
  align?: 'left' | 'right';
}

/**
 * Accessible three-dots dropdown: toggles a glassmorphic popover menu,
 * closes on click-outside / Escape, and animates in and out.
 */
export default function ActionMenu({ items, label = 'Open actions menu', align = 'right' }: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function close() {
    setVisible(false);
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-800/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 min-w-[13rem] rounded-lg border border-slate-800 bg-slate-900/90 p-1 text-slate-200 shadow-2xl backdrop-blur-md transition-all duration-150 ease-out ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${visible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'}`}
        >
          {items.map((item) => {
            const cls = `flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-violet-500/15 hover:text-white ${
              item.active ? 'text-emerald-300' : 'text-slate-300'
            }`;
            const inner = (
              <>
                {item.icon && <span className="shrink-0 text-violet-400">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </>
            );
            return item.to ? (
              <Link key={item.label} role="menuitem" to={item.to} onClick={close} className={cls}>
                {inner}
              </Link>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  item.onSelect?.();
                  close();
                }}
                className={cls}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
