import { memo } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface StatusBadgeProps {
  status: "valid" | "warning" | "error" | "default_applied";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    valid: {
      icon: CheckCircle,
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Valid",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Warning",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Error",
    },
    default_applied: {
      icon: Info,
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Default Applied",
    },
  };

  const { icon: Icon, bg, text, label } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default memo(StatusBadge);
