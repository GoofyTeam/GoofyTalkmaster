import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
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
        "http://localhost:8080/api/sanctum/csrf-cookie",
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

      const response = await fetch("http://localhost:8080/api/register", {
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold text-center">Page d'inscription</h1>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <p className="block text-sm font-medium text-gray-700">Nom</p>
            <Input
              id="name"
              type="text"
              placeholder="Entrez votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700">Prénom</p>
            <Input
              id="first_name"
              type="text"
              placeholder="Entrez votre prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700">
              Adresse Mail
            </p>
            <Input
              id="email"
              type="email"
              placeholder="Entrez votre adresse mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700">
              Mot de passe
            </p>
            <Input
              id="password"
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700">
              Confirmez Mot de passe
            </p>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirmer votre mot de passe"
              value={password_confirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full">
            S'inscrire
          </Button>
        </form>
      </div>
    </div>
  );
}
export default Register;
