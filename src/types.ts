/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
}

export interface MenuItem {
  id: string;
  title: string;
  iconName: string; // referencing lucide-react icon
  subItems?: SubMenuItem[];
}

export interface MenuCategory {
  categoryName: string;
  items: MenuItem[];
}

export interface SystemStatus {
  isExternalDbActive: boolean;
  activeSidebarId: string; // ID of active menu or sub-menu
}

export interface WorkspaceTab {
  id: string; // Unique ID (e.g. 'dashboard', 'database-pelanggan', 'master-parameter', etc.)
  title: string;
}
