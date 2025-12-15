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

  // StyleEditor icons
  export const Palette: any;
  export const Type: any;
  export const LayoutTemplate: any;
  export const Layout: any;
  export const RotateCcw: any;
  export const ChevronUp: any;
  export const ZoomIn: any;
  export const ZoomOut: any;
  export const AlignLeft: any;
  export const AlignCenter: any;
  export const AlignRight: any;
  export const Move: any;
  export const Settings2: any;
  export const Pipette: any;
  
  // DashboardSidebar icons
  export const MessageSquare: any;
  export const Star: any;
  export const Clipboard: any;
  export const ClipboardList: any;
  export const Bookmark: any;
  export const ChevronRight: any;
  export const ChevronLeft: any;
  export const HelpCircle: any;
  
  // TeamPage icons
  export const FolderKanban: any;
  export const MessageCircle: any;
  export const Trophy: any;

  // Common UI icons - heavily used across app
  export const Check: any;
  export const Shield: any;
  export const Lock: any;
  export const XCircle: any;
  export const AlertTriangle: any;
  export const Info: any;
  export const Home: any;
  export const Zap: any;
  export const Clock: any;
  export const Mail: any;
  export const Phone: any;
  export const Globe: any;
  export const MapPin: any;
  export const Bell: any;
  export const Heart: any;
  export const ThumbsUp: any;
  export const Share2: any;
  export const MoreHorizontal: any;
  export const MoreVertical: any;
  export const Copy: any;
  export const Edit: any;
  export const Edit2: any;
  export const Edit3: any;
  export const Pencil: any;
  export const PencilLine: any;
  export const Send: any;
  export const Upload: any;
  export const LogOut: any;
  export const LogIn: any;
  export const UserPlus: any;
  export const UserMinus: any;
  export const ChartBar: any;
  export const BarChart2: any;
  export const BarChart3: any;
  export const LineChart: any;
  export const PlusCircle: any;
  export const MinusCircle: any;
  export const AlertOctagon: any;
  export const XIcon: any;
  export const FileQuestion: any;
  export const Repeat: any;
  export const RotateCw: any;
  export const ExternalLink: any;
  export const ArrowRight: any;
  export const ArrowUpRight: any;
  export const ArrowDownRight: any;
  export const CircleCheck: any;
  export const CircleX: any;
  export const CircleAlert: any;
  export const CircleDashed: any;
  export const Hourglass: any;

  // Re-export types
  export type LucideIcon = any;
}
