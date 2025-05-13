import { RouterProvider } from "@tanstack/react-router";
import { router } from "./main";
import { useAuth } from "./store/Auth";

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export default InnerApp;
