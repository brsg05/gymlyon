import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        {back ? (
          <Link
            href={back}
            className="tap -ml-2 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-6" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}
