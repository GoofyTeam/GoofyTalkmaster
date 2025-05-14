import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "./auth/useAuth";
import { router } from "./main";

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export default InnerApp;
