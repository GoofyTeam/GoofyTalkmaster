import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== password_confirmation) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const csrfResponse = await fetch(
        `${API_BASE_URL}/api/sanctum/csrf-cookie`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      if (!csrfResponse.ok) {
        const errorData = await csrfResponse.json();
        throw new Error(
          errorData.message || "Erreur lors de la récupération du CSRF token",
        );
      }

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
        },
        body: JSON.stringify({
          name,
          first_name: firstName,
          email,
          password,
          password_confirmation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur d'inscription");
      }

      await response.json();
      navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <ArrowLeft size={16} /> Retour à l'accueil
            </Link>
            <CardTitle className="text-2xl">Inscrivez-vous</CardTitle>
            <CardDescription>Rejoignez-nos talks !</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Entrez votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Entrez votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Entrez votre adresse mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">
                    Confirmez le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmer votre mot de passe"
                    value={password_confirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <Button type="submit" className="w-full">
                  S'inscrire
                </Button>
              </div>
              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm underline cursor-pointer"
                >
                  Vous avez déjà un compte ?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default Register;
