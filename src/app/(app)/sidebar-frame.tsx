"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { rememberPreference, SIDEBAR_COOKIE } from "@/lib/ui-preferences";

const CollapsedContext = createContext<{ collapsed: boolean; expand: () => void }>({ collapsed: false, expand: () => {} });

/** Whether the sidebar is collapsed to its icons, for the parts that need more than CSS. */
export function useSidebarCollapsed(): boolean {
  return use(CollapsedContext).collapsed;
}

/** Opens a collapsed sidebar, for a part that needs its full width (the update notice). */
export function useExpandSidebar(): () => void {
  return use(CollapsedContext).expand;
}

/**
 * The sidebar's frame, collapsible to a strip of icons.
 * The choice is kept in a cookie, so the server renders the next page the
 * same way. Inside, `group-data-collapsed/sidebar:` variants hide what
 * doesn't fit, so the server-rendered parts need no state of their own.
 */
export function SidebarFrame({
  initialCollapsed,
  brand,
  children,
}: {
  initialCollapsed: boolean;
  /** The logo, which the expand button replaces on hover while collapsed. */
  brand: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // A drawer left open must not keep the desktop page inert after a resize.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const close = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const change = (next: boolean) => {
    setCollapsed(next);
    rememberPreference(SIDEBAR_COOKIE, next ? "collapsed" : "expanded");
  };
  const toggle = () => change(!collapsed);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <header className="mobile-app-header sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-line bg-sidebar px-3 md:hidden">
          <Dialog.Trigger asChild>
            <button type="button" aria-label="Open navigation" className="grid size-11 shrink-0 place-items-center rounded-control hover:bg-hover">
              <Menu size={22} aria-hidden="true" />
            </button>
          </Dialog.Trigger>
          <span className="font-serif text-2xl">Dossier</span>
        </header>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content
            aria-describedby={undefined}
            className="mobile-navigation fixed inset-y-0 left-0 z-50 flex w-[min(300px,calc(100vw-32px))] flex-col overflow-y-auto border-r border-line bg-sidebar shadow-menu"
            onClickCapture={(event) => {
              if (event.target instanceof Element && event.target.closest("a[href]")) setMobileOpen(false);
            }}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <div className="flex items-center gap-2 border-b border-line p-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">{brand}</div>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close navigation" className="grid size-11 shrink-0 place-items-center rounded-control hover:bg-hover">
                  <X size={22} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            <CollapsedContext value={{ collapsed: false, expand: () => {} }}>{children}</CollapsedContext>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <CollapsedContext value={{ collapsed, expand: () => change(false) }}>
        <aside
          data-collapsed={collapsed || undefined}
          className={cn(
            "group/sidebar sticky top-0 hidden h-dvh md:flex shrink-0 flex-col self-start overflow-x-hidden overflow-y-auto border-r border-line bg-sidebar motion-safe:transition-[width] motion-safe:duration-200",
            collapsed ? "w-12" : "w-[260px]",
          )}
        >
          <div
            className={cn(
              "group/header relative flex items-center gap-2 border-b border-line",
              collapsed ? "justify-center px-1 py-3" : "pt-3 pr-3 pb-4 pl-4",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2",
                // Collapsed, the logo and the expand button share one slot.
                collapsed &&
                  "flex-none group-hover/header:opacity-0 group-has-[button:focus-visible]/header:opacity-0 motion-safe:transition-opacity",
              )}
            >
              {brand}
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-control text-muted hover:bg-hover hover:text-ink",
                collapsed &&
                  "absolute inset-0 m-auto size-8 bg-surface opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 motion-safe:transition-opacity",
              )}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          </div>
          {children}
        </aside>
      </CollapsedContext>
    </>
  );
}
