import { MotionConfig } from "motion/react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import interFont from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import jetbrainsMonoFont from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";

import type { Route } from "./+types/root";
import "./app.css";
import { AppSkeleton } from "~/components/app-skeleton";
import { useApplyTheme, useTheme } from "~/hooks/use-theme";
import { getThemeScript } from "~/lib/theme";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
  {
    rel: "preload",
    href: interFont,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: jetbrainsMonoFont,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // the theme script adds the dark class before React hydrates
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(),
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <AppSkeleton />;
}

export default function App() {
  const { theme } = useTheme();
  useApplyTheme(theme);

  return (
    <MotionConfig reducedMotion="user">
      <Outlet />
    </MotionConfig>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
