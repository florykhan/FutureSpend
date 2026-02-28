import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface PageShellProps {
  children: React.ReactNode;
  /** If true, use sidebar layout (dashboard, calendar, etc.). If false, full-width (landing). */
  withSidebar?: boolean;
}

export function PageShell({ children, withSidebar = true }: PageShellProps) {
  if (!withSidebar) {
    return (
      <>
        <Navbar />
        <main>{children}</main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-slate-50/30">{children}</main>
      </div>
    </>
  );
}
