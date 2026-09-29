import { MotionConfig } from "motion/react";
import {
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
import { ErrorPage } from "~/components/error-page";
import { useApplyTheme, useTheme } from "~/hooks/use-theme";
import { getNoteAppearanceScript } from "~/lib/note-appearance";
import { getThemeScript } from "~/lib/theme";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-title" content="Anynote" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: getNoteAppearanceScript(),
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
  return <ErrorPage error={error} fullScreen />;
}
