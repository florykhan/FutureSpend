import { Navbar } from "./Navbar";
import { AppLayout } from "./AppLayout";

interface PageShellProps {
  children: React.ReactNode;
  /** If true, use app layout (sidebar + top bar). If false, full-width landing with navbar. */
  withSidebar?: boolean;
}

export function PageShell({ children, withSidebar = true }: PageShellProps) {
  if (!withSidebar) {
    return (
      <>
        <Navbar />
        <main className="w-full min-w-0 bg-transparent pt-14">{children}</main>
      </>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
