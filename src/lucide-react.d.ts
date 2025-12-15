// Type declarations for lucide-react icon imports
// This file allows importing icons directly from their paths

declare module "lucide-react/dist/esm/icons/*" {
  import { LucideIcon } from "lucide-react";
  const icon: LucideIcon;
  export default icon;
}

// Allow named exports (fix for TypeScript errors)
declare module "lucide-react" {
  export const Crown: any;
  export const User: any;
  export const CreditCard: any;
  export const TrendingUp: any;
  export const TrendingDown: any;
  export const DollarSign: any;
  export const XCircle: any;
  export const AlertCircle: any;
  export const RefreshCw: any;
  export const Award: any;
  export const FileText: any;
  export const Loader: any;
  export const Briefcase: any;
  export const Link: any;
  export const Calendar: any;
  export const CheckCircle: any;

  // DocumentBuilder icons
  export const LayoutDashboard: any;
  export const Settings: any;
  export const Plus: any;
  export const Languages: any;
  export const Save: any;
  export const Printer: any;
  export const ArrowLeft: any;
  export const Sparkles: any;
  export const ChevronDown: any;
  export const Trash2: any;
  export const Camera: any;
  export const BookTemplate: any;
  export const X: any;
  export const Package: any;
  export const Wrench: any;
  export const Receipt: any;
  export const Building2: any;
  export const Users: any;
  export const Image: any;
  export const UserCheck: any;
  export const CheckCircle2: any;
  export const MousePointerClick: any;
  export const Calculator: any;
  export const PieChart: any;
  export const Activity: any;
  export const ShieldAlert: any;
  export const Wallet: any;
  export const Download: any;
  export const Folders: any;
  export const Loader2: any;
  export const Menu: any;
  export const Search: any;
  export const Filter: any;
  export const ArrowUpDown: any;
  export const ArrowUp: any;
  export const ArrowDown: any;
  export const Eye: any;
  export const EyeOff: any;
  export const CloudOff: any;
  export const Cloud: any;

  // Add more as needed...
}
