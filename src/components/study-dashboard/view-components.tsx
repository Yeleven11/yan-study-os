import { useEffect, useRef } from "react";

export const MOBILE_UNSUPPORTED_MESSAGE = "Unfortunately this website is not supported on mobile at this time.";

export function FocusModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const focusable = panel.querySelectorAll<HTMLElement>(
      "button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])",
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) {
      first.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="h-full max-h-[92vh] w-full max-w-[1200px] overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(92vh-56px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function MobileUnsupportedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 text-[var(--text)] md:hidden">
      <div className="w-full max-w-sm rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-center">
        <p className="text-sm font-medium text-[var(--text)]">{MOBILE_UNSUPPORTED_MESSAGE}</p>
      </div>
    </div>
  );
}
