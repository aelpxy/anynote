import { useLocation, useMatch } from "react-router";

type SidebarLocationState = {
  sidebarSource?: string;
} | null;

// notes opened from outside the sidebar are highlighted under Documents
const defaultSource = "documents";

export function useSidebarSelection(to: string, source: string) {
  const location = useLocation();
  const isRouteActive = useMatch(to) !== null;
  const selectedSource =
    (location.state as SidebarLocationState)?.sidebarSource ?? defaultSource;

  return {
    isSelected: isRouteActive && selectedSource === source,
    state: { sidebarSource: source },
  };
}
