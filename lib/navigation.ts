import {
  ClipboardCheck,
  CreditCard,
  Files,
  FolderOpen,
  LayoutGrid,
  MessageSquareQuote,
  Sparkles,
  TimerReset,
  CalendarDays,
} from "lucide-react";

export const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutGrid },
  { title: "Timeline", href: "/timeline", icon: TimerReset },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Designs", href: "/designs", icon: Sparkles },
  { title: "Feedback", href: "/feedback", icon: MessageSquareQuote },
  { title: "Invoices", href: "/invoices", icon: CreditCard },
  { title: "Files", href: "/files", icon: FolderOpen },
  { title: "Project Details", href: "/project-details", icon: Files },
  { title: "Client Actions", href: "/client-actions", icon: ClipboardCheck },
];
