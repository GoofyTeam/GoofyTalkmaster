import { createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./assets/styles/styles.css";
import InnerApp from "./App.tsx";
import { AuthProvider } from "./auth/context.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
//import reportWebVitals from "./reportWebVitals.ts";

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
      role: "public",
      loading: true,
      isLoggingOut: false,
      fetchUser: async () => {
        return null;
      },
      logout: async () => {},
    },
  },
  //defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="tlkmstr-theme">
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals(console.log);
