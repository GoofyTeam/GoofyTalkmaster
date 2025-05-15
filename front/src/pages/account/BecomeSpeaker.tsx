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
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { BookOpen, MessageCircle, Mic, Share2 } from "lucide-react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const FEATURES: FeatureProps[] = [
  {
    icon: <Share2 />,
    title: "Transmettre ce que tu as appris",
    description:
      "Partager ton parcours et tes découvertes permet d’en faire profiter d’autres et de faire avancer ta communauté.",
  },
  {
    icon: <Mic />,
    title: "Améliorer ton aisance à l’oral",
    description:
      "Prendre la parole en public est un excellent exercice pour renforcer ta clarté, ton impact et ta confiance en toi.",
  },
  {
    icon: <BookOpen />,
    title: "Structurer ta pensée",
    description:
      "Préparer une conférence t’oblige à organiser tes idées et à mieux comprendre ce que tu veux vraiment dire.",
  },
  {
    icon: <MessageCircle />,
    title: "Ouvrir la discussion",
    description:
      "Une conférence est souvent le début d’échanges enrichissants avec ton audience et d'autres intervenants.",
  },
];

const becameSpeakerSchema = z.object({
  phone: z.string().min(10).max(15),
  description: z.string().min(10).max(999),
});

const BecomeSpeaker = () => {
  const router = useRouter();
  const { requests } = useLoaderData({
    from: "/account/become-speaker",
  });

  const hasOpenRequest = requests.some(
    (request: { status: string }) => request.status === "open",
  );
  const lastOpenRequest = requests.find(
    (request: { status: string }) => request.status === "open",
  );

  const becameSpeakerForm = useForm<z.infer<typeof becameSpeakerSchema>>({
    resolver: zodResolver(becameSpeakerSchema),
    defaultValues: {
      phone: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof becameSpeakerSchema>) => {
    toast("Envoi de votre proposition de talk en cours...");
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

    const formData = new FormData();
    formData.append("phone", values.phone);
    formData.append("description", values.description);

    const response = await fetch(`${API_BASE_URL}/api/speakers-request`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de la soumission");
    }

    toast("Votre proposition de talk a été envoyée avec succès !");

    router.invalidate();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <section id="howItWorks" className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold ">
          Pourquoi{" "}
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
            Devenir{" "}
          </span>
          Conférencier ?
        </h2>
        <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
          Rejoignez notre communauté de conférenciers et partagez vos
          connaissances avec le monde entier. Que vous soyez un expert dans
          votre domaine ou simplement passionné par un sujet, nous vous offrons
          une plateforme pour vous exprimer et inspirer les autres.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map(({ icon, title, description }: FeatureProps) => (
            <Card key={title} className="bg-muted/50">
              <CardHeader>
                <CardTitle className="grid gap-4 place-items-center">
                  {icon}
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>{description}</CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="bg-muted/50 mt-8 max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                Nous avons besoin de vous !
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Déposez votre candidature pour devenir conférencier dès
                aujourd'hui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasOpenRequest ? (
                <>
                  <p className="text-muted-foreground italic">
                    Vous avez déjà une candidature datée du{" "}
                    {format(
                      lastOpenRequest?.created_at ?? new Date(),
                      "dd/MM/yyyy",
                    )}{" "}
                    en cours.
                  </p>
                  <Link
                    to="/account"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    Retour à mon compte
                  </Link>
                </>
              ) : (
                <Form {...becameSpeakerForm}>
                  <form
                    onSubmit={becameSpeakerForm.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <FormField
                      control={becameSpeakerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre numéro de téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="+336..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={becameSpeakerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Pourquoi voulez-vous devenir conférencier ?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez votre motivation"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Envoyer ma candidature</Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default BecomeSpeaker;
