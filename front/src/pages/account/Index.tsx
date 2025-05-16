import { useAuth } from "@/auth/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const AccountFormSchema = z.object({
  firstname: z.string().min(2, {
    message: "Le prénom doit comporter au moins 2 caractères.",
  }),
  lastname: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères.",
  }),
  description: z.string(),
});

const PasswordFormSchema = z
  .object({
    current_password: z.string().min(8, {
      message: "Le mot de passe doit comporter au moins 8 caractères.",
    }),
    new_password: z.string().min(8, {
      message: "Le mot de passe doit comporter au moins 8 caractères.",
    }),
    confirm_password: z.string().min(8, {
      message: "Le mot de passe doit comporter au moins 8 caractères.",
    }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  });

function AccountPage() {
  const { user, logout, loading, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = React.useState(false);

  // États pour les messages de validation séparés par formulaire
  const [profileError, setProfileError] = React.useState("");
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState(false);

  const [profilePicture, setProfilePicture] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");

  // Mettre useEffect en premier pour éviter des erreurs de hooks
  React.useEffect(() => {
    if (!user && !loading) {
      navigate({ to: "/app" });
    }
  }, [user, loading, navigate]);

  // Function pour effacer les messages après un certain délai
  const clearProfileMessages = React.useCallback(() => {
    setTimeout(() => {
      setProfileError("");
      setProfileSuccess("");
    }, 5000);
  }, []);

  const clearPasswordMessages = React.useCallback(() => {
    setTimeout(() => {
      setPasswordError("");
      setPasswordSuccess("");
    }, 5000);
  }, []);

  // Gestionnaire de formulaire
  const form = useForm<z.infer<typeof AccountFormSchema>>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      description: user?.description || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof PasswordFormSchema>>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Gestionnaire de changement de photo de profil
  const handleProfilePictureChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target?.files?.[0]) {
      const file = event.target.files[0];
      setProfilePicture(file);

      // Créer une URL de prévisualisation
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  // Réinitialiser la prévisualisation lorsque le mode d'édition change
  React.useEffect(() => {
    if (!isEditMode) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setProfilePicture(null);
    }
  }, [isEditMode, previewUrl]);

  // Fonction pour sauvegarder le profil avec photo
  const handleSaveProfile = React.useCallback(
    async (values: z.infer<typeof AccountFormSchema>) => {
      if (!user) {
        setProfileError("Vous devez être connecté pour modifier votre profil");
        clearProfileMessages();
        return;
      }

      setIsSaving(true);
      setProfileError("");
      setProfileSuccess("");

      try {
        // Obtenir un cookie CSRF frais
        await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
          credentials: "include",
        });

        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("XSRF-TOKEN="))
          ?.split("=")[1];

        if (!csrfToken) {
          throw new Error("CSRF token not found");
        }

        // Utiliser FormData pour l'envoi de fichiers
        const formData = new FormData();
        formData.append("name", values.lastname);
        formData.append("first_name", values.firstname);
        formData.append("description", values.description || "");
        formData.append("email", user.email);
        formData.append("role", user.role);
        formData.append("_method", "PUT"); // Pour simuler une requête PUT

        // Ajouter la photo de profil si elle a été modifiée
        if (profilePicture) {
          formData.append("profile_picture", profilePicture);
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
          method: "POST", // Utiliser POST pour FormData mais avec _method=PUT pour Laravel
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Erreur ${response.status}: ${response.statusText}`,
          );
        }

        // Rafraîchir les données utilisateur dans le contexte
        await fetchUser();

        // Message de succès
        setProfileSuccess("Profil mis à jour avec succès!");
        clearProfileMessages();
        setIsEditMode(false);
      } catch (err) {
        setProfileError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour du profil",
        );
        clearProfileMessages();
      } finally {
        setIsSaving(false);
      }
    },
    [user, fetchUser, clearProfileMessages, profilePicture],
  );

  // Fonction pour changer le mot de passe
  const handlePasswordChange = React.useCallback(
    async (values: z.infer<typeof PasswordFormSchema>) => {
      if (!user) {
        setPasswordError(
          "Vous devez être connecté pour changer votre mot de passe",
        );
        clearPasswordMessages();
        return;
      }

      setIsSaving(true);
      setPasswordError("");
      setPasswordSuccess("");

      try {
        // Obtenir un cookie CSRF frais
        await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
          credentials: "include",
        });

        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("XSRF-TOKEN="))
          ?.split("=")[1];

        if (!csrfToken) {
          throw new Error("CSRF token not found");
        }

        // Envoi des données de mot de passe avec le format attendu par l'API
        const passwordResponse = await fetch(
          `${API_BASE_URL}/api/user/password`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
            },
            credentials: "include",
            body: JSON.stringify({
              current_password: values.current_password,
              password: values.new_password,
              password_confirmation: values.confirm_password,
            }),
          },
        );

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(
            errorData.message ||
              `Erreur ${passwordResponse.status}: ${passwordResponse.statusText}`,
          );
        }

        // Réinitialiser le formulaire
        passwordForm.reset();

        // Message de succès
        setPasswordSuccess(
          "Mot de passe mis à jour avec succès! Déconnexion en cours...",
        );
        clearPasswordMessages();

        // Attendre un court instant pour permettre à l'utilisateur de voir le message de succès
        setTimeout(async () => {
          try {
            // Déconnecter l'utilisateur
            await logout();
            // La redirection sera gérée par le AuthProvider
          } catch (error) {
            console.error(
              "Erreur lors de la déconnexion après changement de mot de passe:",
              error,
            );
            navigate({ to: "/auth/login" });
          }
        }, 2000);
      } catch (err) {
        setPasswordError(
          err instanceof Error
            ? err.message
            : "Erreur lors du changement de mot de passe",
        );
        clearPasswordMessages();
      } finally {
        setIsSaving(false);
      }
    },
    [user, passwordForm, clearPasswordMessages, logout, navigate],
  );

  // Si en chargement, afficher un indicateur
  if (loading) {
    return <div className="container mx-auto py-8">Chargement...</div>;
  }

  // Si l'utilisateur n'est pas connecté, la redirection est gérée par useEffect
  if (!user) {
    return <div className="container mx-auto py-8">Redirection...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestion de compte</h1>

      <div className="grid gap-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Gérez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messages de validation pour le profil */}
            {profileError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                {profileSuccess}
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={previewUrl || user.profile_picture}
                  alt={`${user.firstname} ${user.lastname}`}
                />
                <AvatarFallback>
                  {user.firstname?.[0]}
                  {user.lastname?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div>
                  <Label htmlFor="profile_picture">Photo de profil</Label>
                  <Input
                    id="profile_picture"
                    type="file"
                    className="mt-1"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleProfilePictureChange}
                  />
                </div>
              )}
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSaveProfile)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Parlez-nous de vous..."
                          className="resize-none"
                          disabled={!isEditMode}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditMode ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditMode(false)}
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setIsEditMode(true)}>
                      Modifier
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Modifier le mot de passe</CardTitle>
              <CardDescription>
                Assurez-vous d'utiliser un mot de passe fort
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="cursor-pointer"
              title={
                showPasswords
                  ? "Masquer les mots de passe"
                  : "Afficher les mots de passe"
              }
            >
              {showPasswords ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {/* Messages de validation pour le changement de mot de passe */}
            {passwordError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                {passwordSuccess}
              </div>
            )}

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe actuel</FormLabel>
                      <FormControl>
                        <Input
                          type={showPasswords ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          type={showPasswords ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          type={showPasswords ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Chargement..." : "Changer le mot de passe"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {user.role === "public" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/account/become-speaker">Devenir conférencier</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Faites une demande pour devenir conférencier sur notre
                  plateforme
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
