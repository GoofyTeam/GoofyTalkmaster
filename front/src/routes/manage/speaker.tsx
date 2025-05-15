import Speaker from "@/pages/manage/Speaker";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/speaker")({
  beforeLoad: async ({ context }) => {
    const userData = await context.auth.fetchUser();
    const isLoggedIn = !!userData;
    const userRole = userData?.role || "public";

    if (!isLoggedIn) {
      throw redirect({ to: "/auth/login" });
    }
    if (isLoggedIn && userRole === "public") {
      throw redirect({ to: "/app" });
    }
  },
  component: Speaker,
});
