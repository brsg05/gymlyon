import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Dumbbell className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gymlyon</h1>
            <p className="text-sm text-muted-foreground">Academia e bem-estar, em poucos toques.</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
