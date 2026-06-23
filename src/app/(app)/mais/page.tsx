import Link from "next/link";
import { Droplets, Scale, Moon, LogOut, ChevronRight, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { signOut } from "@/lib/actions/auth";
import { ageFromBirth } from "@/lib/domain/time";
import { NIVEL_LABEL, OBJETIVO_LABEL, SEXO_LABEL } from "@/lib/domain/constants";
import { intf, nf } from "@/lib/utils";

const LINKS = [
  { href: "/agua", label: "Água", icon: Droplets },
  { href: "/peso", label: "Peso", icon: Scale },
  { href: "/sono", label: "Sono", icon: Moon },
];

export default async function MaisPage() {
  const supabase = await createClient();
  const [{ data: auth }, profile] = await Promise.all([supabase.auth.getUser(), getProfile()]);
  const email = auth.user?.email ?? "";

  return (
    <>
      <PageHeader title="Mais" subtitle="Perfil e ajustes" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <User className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{email}</p>
              {profile ? (
                <p className="text-sm text-muted-foreground">
                  {OBJETIVO_LABEL[profile.objetivo]} · {SEXO_LABEL[profile.sexo]} · {ageFromBirth(profile.data_nascimento)} anos
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {profile ? (
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
              <Info label="Altura" value={`${intf(profile.altura_cm)} cm`} />
              <Info label="Peso inicial" value={`${nf(profile.peso_inicial_kg, 1)} kg`} />
              <Info label="TMB" value={profile.tmb ? `${intf(profile.tmb)} kcal` : "—"} />
              <Info label="TDEE" value={profile.tdee ? `${intf(profile.tdee)} kcal` : "—"} />
              <Info label="Atividade" value={NIVEL_LABEL[profile.nivel_atividade]} />
              {profile.percentual_gordura != null ? (
                <Info label="% Gordura" value={`${nf(profile.percentual_gordura, 1)}%`} />
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 font-medium transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground" />
                {label}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <form action={signOut}>
          <Button type="submit" variant="outline" size="lg" className="w-full text-destructive">
            <LogOut /> Sair
          </Button>
        </form>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
