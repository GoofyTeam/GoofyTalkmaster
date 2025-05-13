import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/Auth";
import { zodResolver } from "@hookform/resolvers/zod";
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
  profile_picture: z.string().optional(),
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
  const { user: authUser, logout } = useAuth();
  const [isEditMode, setIsEditMode] = React.useState(false);

  // Créer un utilisateur factice pour les tests si l'utilisateur n'est pas connecté
  const user = authUser || {
    id: "test-user",
    role: "public",
    lastname: "Doe",
    firstname: "John",
    email: "john.doe@example.com",
    profile_picture: "",
    description: "Utilisateur test",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const form = useForm<z.infer<typeof AccountFormSchema>>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      description: user.description || "",
      profile_picture: user.profile_picture || "",
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

  const handleSaveProfile = (values: z.infer<typeof AccountFormSchema>) => {
    // API call to save profile information
    console.log(values);
    setIsEditMode(false);
  };

  const handlePasswordChange = (values: z.infer<typeof PasswordFormSchema>) => {
    // API call to change password
    console.log(values);
    passwordForm.reset();
  };

  const handleBecomeSpeaker = () => {
    // API call to request speaker status
    console.log("Speaker request");
  };

  const handleDeleteAccount = () => {
    // API call to delete account
    console.log("Account deleted");
    logout();
  };

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
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={user.profile_picture}
                  alt={`${user.firstname} ${user.lastname}`}
                />
                <AvatarFallback>
                  {user.firstname[0]}
                  {user.lastname[0]}
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div>
                  <Label htmlFor="profile_picture">Photo de profil</Label>
                  <Input id="profile_picture" type="file" className="mt-1" />
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
                    >
                      Annuler
                    </Button>
                    <Button type="submit">Enregistrer</Button>
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
          <CardHeader>
            <CardTitle>Modifier le mot de passe</CardTitle>
            <CardDescription>
              Assurez-vous d'utiliser un mot de passe fort
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        <Input type="password" {...field} />
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
                        <Input type="password" {...field} />
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
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">Changer le mot de passe</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Actions spécifiques */}
        <Card>
          <CardHeader>
            <CardTitle>Actions du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bouton pour devenir conférencier - uniquement visible pour les utilisateurs BASIC avec email vérifié */}
            {user.role === "public" && (
              <div>
                <Button onClick={handleBecomeSpeaker}>
                  Devenir conférencier
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Faites une demande pour devenir conférencier sur notre
                  plateforme
                </p>
              </div>
            )}

            <Separator />

            {/* Déconnexion */}
            <div>
              <Button variant="outline" onClick={logout}>
                Se déconnecter
              </Button>
            </div>

            <Separator />

            {/* Suppression du compte */}
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Supprimer mon compte</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Êtes-vous absolument sûr?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cela supprimera
                      définitivement votre compte et toutes les données
                      associées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      Continuer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AccountPage;
