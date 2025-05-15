import { API_BASE_URL } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

const askTalkSchema = z.object({
  title: z.string().min(2).max(254),
  subject: z.string().min(2).max(99),
  description: z.string().min(2).max(500),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

const AskNewTalk = () => {
  const askTalkForm = useForm<z.infer<typeof askTalkSchema>>({
    resolver: zodResolver(askTalkSchema),
    defaultValues: {
      title: "",
      subject: "",
      description: "",
      level: "beginner",
    },
  });

  const onSubmit = async (values: z.infer<typeof askTalkSchema>) => {
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
    formData.append("title", values.title);
    formData.append("subject", values.subject);
    formData.append("description", values.description);
    formData.append("level", values.level);
    formData.append("duration_minutes", "30");

    const response = await fetch(`${API_BASE_URL}/api/talks`, {
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
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Proposer un nouveau talk</CardTitle>
        <CardDescription>Proposez une nouvelle idée de talk.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...askTalkForm}>
          <form
            onSubmit={askTalkForm.handleSubmit(onSubmit)}
            className="space-y-2"
          >
            <FormField
              control={askTalkForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du talk</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={askTalkForm.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={askTalkForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Merci de décrire votre talk au mieux."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row items-center justify-between">
              <FormField
                control={askTalkForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau de difficulté</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un niveau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Débutant</SelectItem>
                        <SelectItem value="intermediate">
                          Intermédiaire
                        </SelectItem>
                        <SelectItem value="advanced">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="ml-auto mr-0">
                Proposer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AskNewTalk;
