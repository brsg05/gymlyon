"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function MagicPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <MailCheck className="size-10 text-primary" />
          <p className="font-medium">Link enviado</p>
          <p className="text-sm text-muted-foreground">
            Abra o link enviado para <strong>{email}</strong> para entrar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="E-mail" htmlFor="email" hint="Enviaremos um link de acesso sem senha.">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Enviar link mágico
          </Button>
        </form>
      </CardContent>
      <p className="pb-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}
