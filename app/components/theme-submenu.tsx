import { Menu } from "@base-ui/react/menu";
import { Monitor, Moon, Sun, SunMoon } from "lucide-react";

import { MenuRadioItem } from "~/components/menu-radio-item";
import { MenuSubmenu } from "~/components/menu-submenu";
import { useTheme } from "~/hooks/use-theme";
import { isTheme } from "~/lib/theme";

export function ThemeSubmenu() {
  const { theme, setTheme } = useTheme();

  return (
    <MenuSubmenu icon={SunMoon} label="Theme">
      <Menu.RadioGroup
        value={theme}
        onValueChange={(value) => {
          if (isTheme(value)) setTheme(value);
        }}
      >
        <MenuRadioItem value="light" icon={Sun}>
          Light
        </MenuRadioItem>
        <MenuRadioItem value="dark" icon={Moon}>
          Dark
        </MenuRadioItem>
        <MenuRadioItem value="system" icon={Monitor}>
          System
        </MenuRadioItem>
      </Menu.RadioGroup>
    </MenuSubmenu>
  );
}
