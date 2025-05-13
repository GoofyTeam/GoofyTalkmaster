import type { AuthState } from "@/lib/types";
import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface TalkmasterContext {
  auth: AuthState;
}

export const Route = createRootRouteWithContext<TalkmasterContext>()({
  beforeLoad: async ({ context, location }) => {
    const isLoggedIn = context.auth.isAuthenticated;
    const userRole = context.auth.role;
    const isAuthPage = location.pathname.startsWith("/auth");
    const isManagePage = location.pathname.startsWith("/manage");

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
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
