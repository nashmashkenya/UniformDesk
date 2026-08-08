import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Palette,
  PenLine,
  Plug,
  Receipt,
  RefreshCw,
  Search,
  Settings2,
  Shirt,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

const iconProps = {
  size: 16,
  strokeWidth: 1.85,
  absoluteStrokeWidth: false,
  "aria-hidden": true as const,
};

function wrap(Icon: LucideIcon) {
  return function NavIcon() {
    return <Icon {...iconProps} />;
  };
}

/** Shared modern icons for school desk + supplier nav */
export const NavIcons = {
  home: wrap(Home),
  desk: wrap(LayoutDashboard),
  issue: wrap(PenLine),
  stock: wrap(Warehouse),
  activity: wrap(Activity),
  ops: wrap(Settings2),
  search: wrap(Search),
  bell: wrap(Bell),
  reports: wrap(ClipboardList),
  deliveries: wrap(Truck),
  orders: wrap(ShoppingCart),
  reorder: wrap(RefreshCw),
  invoices: wrap(Receipt),
  receive: wrap(PackagePlus),
  students: wrap(Users),
  catalog: wrap(Shirt),
  kits: wrap(Package),
  users: wrap(Users),
  integrations: wrap(Plug),
  schools: wrap(Building2),
  branding: wrap(Palette),
  products: wrap(Boxes),
  dispatch: wrap(PackageCheck),
  shortage: wrap(PackageMinus),
  more: wrap(MoreHorizontal),
  file: wrap(FileText),
  logout: wrap(LogOut),
};
