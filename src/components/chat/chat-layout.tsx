import type { ReactNode } from "react";

export function ChatLayout({
  sidebar,
  header,
  children,
  composer,
  isSidebarCollapsed = false,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  composer: ReactNode;
  isSidebarCollapsed?: boolean;
}) {
  return (
    <div className="h-dvh bg-white text-[#2f2f2f]">
      <div
        className={`grid h-full transition-[grid-template-columns] duration-300 ease-out ${
          isSidebarCollapsed
            ? "lg:grid-cols-[52px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]"
        }`}
      >
        <aside className="hidden min-h-0 lg:block">{sidebar}</aside>
        <section className="flex min-h-0 min-w-0 flex-col">
          {header}
          <main className="min-h-0 flex-1 overflow-hidden px-4 md:px-8">
            {children}
          </main>
          <footer className="sticky bottom-0 px-4 pb-4 backdrop-blur md:px-8 md:pb-6">
            {composer}
          </footer>
        </section>
      </div>
    </div>
  );
}
