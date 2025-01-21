// app/interfaces/types/nav-bar-menu/navBarMenuTypes.ts

export type MenuItem = {
  id: number; // Alterado de string para number
  href: string;
  title: string;
  description?: string;
  isHighlight?: boolean;
};

export interface MenuItemMobile {
  href: string;
  title: string;
  description?: string;
}
