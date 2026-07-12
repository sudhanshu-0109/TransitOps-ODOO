import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

export const KpiCard = ({ title, value, subtitle, icon: Icon, delay = 0, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn("overflow-hidden relative border-l-4 border-l-primary bg-card", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-heading text-foreground">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KpiCard;

