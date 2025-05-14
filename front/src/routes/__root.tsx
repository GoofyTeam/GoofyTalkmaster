import type { AuthContextType } from "@/auth/useAuth";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface TalkmasterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<TalkmasterContext>()({
  beforeLoad: async ({ context, location }) => {
    const userData = await context.auth.fetchUser();
    const isLoggedIn = !!userData;
    const userRole = userData?.role || "public";
    const isAuthPage = location.pathname.startsWith("/auth");
    const isManagePage = location.pathname.startsWith("/manage");

    console.log("isLoggedIn", isLoggedIn);
    console.log("userRole", userRole);
    console.log("userData", userData);

    if (isLoggedIn && isAuthPage) {
      redirect({
        to: "/app",
        throw: true,
      });
    }

    if (userRole === "public" && isManagePage) {
      redirect({
        to: "/app",
        throw: true,
      });
    }
  },
  component: () => (
    <>
      <HelmetProvider>
        <title>TalkMaster – Gérez vos conférences techniques facilement</title>
        <meta
          name="description"
          content="TalkMaster est une plateforme intuitive de gestion de conférences techniques. Proposez, planifiez et suivez les talks en temps réel, que vous soyez conférencier, organisateur ou participant."
        />
        <meta
          name="keywords"
          content="talks, conférences, planning, événement, conférencier, organisateur, tech, gestion, agenda, HETIC"
        />
        <meta name="author" content="Équipe TalkMaster" />
        <meta
          property="og:title"
          content="TalkMaster – Gérez vos conférences techniques facilement"
        />
        <meta
          property="og:description"
          content="Proposez, planifiez et consultez les talks d’un événement tech en toute simplicité. Une plateforme pensée pour les conférenciers, les organisateurs et le public."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://talkmaster.stroyco.eu" />
        <meta
          property="og:image"
          content="https://talkmaster.stroyco.eu/logo.png"
        />
        <meta property="og:site_name" content="TalkMaster" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="TalkMaster – Gérez vos conférences techniques facilement"
        />
        <meta
          name="twitter:description"
          content="Une plateforme fluide et moderne pour gérer les talks d’un événement tech : soumission, planning, favoris et plus encore."
        />
        <meta
          name="twitter:image"
          content="https://talkmaster.stroyco.eu/logo.png"
        />
      </HelmetProvider>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
