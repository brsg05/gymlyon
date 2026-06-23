import { Moon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SleepForm } from "@/components/sleep-form";
import { DeleteButton } from "@/components/delete-button";
import { createClient } from "@/lib/supabase/server";
import { deleteSleep } from "@/lib/actions/wellness";
import { formatDateRef, formatTimeBR } from "@/lib/domain/time";
import { QUALIDADE_LABEL } from "@/lib/domain/constants";
import { nf } from "@/lib/utils";
import type { RegistroSono } from "@/lib/types";

export default async function SonoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registro_sono")
    .select("*")
    .order("acordar_em", { ascending: false })
    .limit(30);
  const rows = (data ?? []) as RegistroSono[];
  const last = rows[0] ?? null;

  return (
    <>
      <PageHeader title="Sono" subtitle="Descanso e qualidade" back="/dashboard" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="flex items-end justify-between py-5">
            <div>
              <p className="text-sm text-muted-foreground">Última noite</p>
              <p className="text-4xl font-bold">
                {last ? nf(last.horas_dormidas, 1) : "—"}
                <span className="ml-1 text-lg font-medium text-muted-foreground">h</span>
              </p>
            </div>
            {last ? <Badge variant="muted">{QUALIDADE_LABEL[last.qualidade]}</Badge> : null}
          </CardContent>
        </Card>

        <SleepForm />

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Histórico</p>
          <div className="flex flex-col gap-2">
            {rows.length === 0 ? (
              <Card>
                <CardContent className="p-2">
                  <EmptyState icon={Moon} title="Sem registros" description="Registre seu sono para acompanhar." />
                </CardContent>
              </Card>
            ) : (
              rows.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">
                        {nf(s.horas_dormidas, 1)} h · {QUALIDADE_LABEL[s.qualidade]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRef(s.data_referencia)} · {formatTimeBR(s.deitar_em)}–{formatTimeBR(s.acordar_em)}
                      </p>
                    </div>
                    <DeleteButton action={deleteSleep.bind(null, s.id)} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
