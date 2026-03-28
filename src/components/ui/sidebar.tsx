"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useControllableOpen({
  open,
  defaultOpen = true,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const value = isControlled ? open : uncontrolledOpen;

  const setValue = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return [value, setValue] as const;
}

function SidebarProvider({
  children,
  open,
  defaultOpen = true,
  onOpenChange,
}: React.PropsWithChildren<{
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}>) {
  const [isOpen, setIsOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  });

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      open: isOpen,
      setOpen: setIsOpen,
      toggleSidebar: () => setIsOpen(!isOpen),
    }),
    [isOpen, setIsOpen],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-provider"
        style={
          {
            "--sidebar-width": "16.25rem",
            "--sidebar-width-icon": "3.25rem",
          } as React.CSSProperties
        }
        className="contents"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function Sidebar({
  className,
  collapsible = "offcanvas",
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { open } = useSidebar();

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? "expanded" : "collapsed"}
      data-collapsible={collapsible}
      className={cn(
        "group/sidebar flex h-full min-h-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out",
        collapsible === "none" && "w-full",
        collapsible === "offcanvas" &&
          (open ? "w-[var(--sidebar-width)]" : "w-0 border-r-0"),
        collapsible === "icon" &&
          (open ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-width-icon)]"),
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("min-h-0 flex-1 overflow-hidden", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("border-t border-sidebar-border p-3", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-4 text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/65",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("px-2", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  className,
  isActive = false,
  size = "default",
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean;
  size?: "default" | "lg";
}) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-button"
      data-active={isActive || undefined}
      data-size={size}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none ",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="sidebar-menu-action"
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/menu-item:opacity-100 cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      className={cn(
        "absolute top-1/2 right-0 hidden h-16 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border border-sidebar-border bg-sidebar shadow-sm transition hover:bg-sidebar-accent lg:flex lg:items-center lg:justify-center",
        className,
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon className="size-3.5" />
    </button>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
};
