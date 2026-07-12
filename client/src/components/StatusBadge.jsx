import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const variantMap = {
  // Vehicle & Driver
  AVAILABLE: "bg-success/20 text-success hover:bg-success/30 border-success/30",
  ON_TRIP: "bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30",
  IN_SHOP: "bg-warning/20 text-warning hover:bg-warning/30 border-warning/30",
  RETIRED: "bg-muted text-muted-foreground hover:bg-muted/80 border-border",
  OFF_DUTY: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border",
  SUSPENDED: "bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30",
  
  // Trip
  DRAFT: "bg-muted text-muted-foreground hover:bg-muted/80 border-border",
  DISPATCHED: "bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30",
  COMPLETED: "bg-success/20 text-success hover:bg-success/30 border-success/30",
  CANCELLED: "bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30",
  
  // Maintenance
  ACTIVE: "bg-warning/20 text-warning hover:bg-warning/30 border-warning/30",
  CLOSED: "bg-success/20 text-success hover:bg-success/30 border-success/30",
};

export const StatusBadge = ({ status, className }) => {
  const normalizedStatus = status?.toUpperCase() || 'UNKNOWN';
  const displayStatus = normalizedStatus.replace('_', ' ');
  const variantClass = variantMap[normalizedStatus] || "bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 rounded-full font-medium shadow-none", variantClass, className)}>
      {displayStatus.toLowerCase()}
    </Badge>
  );
};
