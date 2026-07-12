import { Bell, Menu, Moon, Sun, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export const Topbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getAll({ limit: 1 }),
    refetchInterval: 60_000, // refresh every minute
    enabled: !!user,
  });

  // Count unread from first page
  const unreadCount = notifData?.data?.filter(n => !n.isRead).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card border-b h-16 shrink-0">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden mr-2">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">TransitOps</span>
          {user?.role && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/20">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                {user?.role && (
                  <span className="text-xs text-primary font-medium mt-1">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
