import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — EDT Genius" },
      {
        name: "description",
        content: "Connectez-vous ou créez l'espace de votre établissement pour générer vos emplois du temps.",
      },
      { property: "og:title", content: "Connexion — EDT Genius" },
      { property: "og:description", content: "Accédez à votre espace établissement EDT Genius." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/tableau-de-bord" });
  }, [user, loading, navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Email ou mot de passe incorrect."
          : error.message,
      );
      return;
    }
    navigate({ to: "/tableau-de-bord" });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : error.message,
      );
      return;
    }
    if (!data.session) {
      setConfirmationEmail(email);
      return;
    }
    navigate({ to: "/tableau-de-bord" });
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("La connexion Google a échoué.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/tableau-de-bord" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-4" />
          </span>
          EDT Genius
        </Link>
        <Card>
          {confirmationEmail ? (
            <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
                <MailCheck className="size-6" />
              </span>
              <div className="space-y-2">
                <CardTitle>Vérifiez votre boîte mail</CardTitle>
                <CardDescription>
                  Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{confirmationEmail}</span>.
                  Cliquez sur ce lien avant de vous connecter.
                </CardDescription>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setConfirmationEmail(null)}>
                Revenir à la connexion
              </Button>
            </CardContent>
          ) : (
            <>
          <CardHeader>
            <CardTitle>Votre espace établissement</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour générer vos emplois du temps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form className="space-y-4" onSubmit={signIn}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form className="space-y-4" onSubmit={signUp}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up">Mot de passe</Label>
                    <Input
                      id="password-up"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={busy}>
              Continuer avec Google
            </Button>
          </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
