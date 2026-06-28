import Link from "next/link";
import { LineChart, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

export default async function EvolucaoListPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("serie_registro")
    .select("exercicio_id, exercicio(nome, grupo_muscular)")
    .order("registrado_em", { ascending: false })
    .limit(800);

  const seen = new Map<string, { nome: string; grupo: string | null }>();
  for (const row of (data ?? []) as unknown as {
    exercicio_id: string;
    exercicio: { nome: string; grupo_muscular: string | null } | null;
  }[]) {
    if (row.exercicio && !seen.has(row.exercicio_id)) {
      seen.set(row.exercicio_id, { nome: row.exercicio.nome, grupo: row.exercicio.grupo_muscular });
    }
  }
  const items = [...seen.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome, "pt-BR"));

  return (
    <>
      <PageHeader title="Evolução por exercício" subtitle="Carga ao longo do tempo" back="/rotina" />
      <div className="flex flex-col gap-2 px-4 pt-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-2">
              <EmptyState icon={LineChart} title="Sem dados" description="Registre séries na sua rotina para acompanhar a evolução." />
            </CardContent>
          </Card>
        ) : (
          items.map(([id, ex]) => (
            <Link
              key={id}
              href={`/rotina/exercicios/${id}`}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted"
            >
              <span>
                <span className="font-medium">{ex.nome}</span>
                {ex.grupo ? <span className="ml-2 text-xs text-muted-foreground">{ex.grupo}</span> : null}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </>
  );
}
