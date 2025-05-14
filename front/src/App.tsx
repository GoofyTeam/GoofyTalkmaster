import { RouterProvider } from "@tanstack/react-router";
import { router } from "./main";
import { useAuth } from "./auth/useAuth";

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export default InnerApp;
