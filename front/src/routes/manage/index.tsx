import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/")({
  beforeLoad: async ({ context }) => {
    const userData = await context.auth.fetchUser();
    const isLoggedIn = !!userData;

    if (!isLoggedIn) {
      throw redirect({ to: "/auth/login" });
    }

    throw redirect({ to: "/manage/speaker" });
  },
});
