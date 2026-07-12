import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export const navigationMap = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { name: 'Fleet', href: '/fleet', icon: Truck, roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'] },
  { name: 'Drivers', href: '/drivers', icon: Users, roles: ['ADMIN', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { name: 'Trips', href: '/trips', icon: Map, roles: ['ADMIN', 'DISPATCHER', 'FINANCIAL_ANALYST'] },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { name: 'Fuel & expenses', href: '/fuel-expenses', icon: CreditCard, roles: ['ADMIN', 'FINANCIAL_ANALYST'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export const Sidebar = ({ isOpen, setisOpen }) => {
  const { user, logout } = useAuth();

  const filteredNav = navigationMap.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setisOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-full bg-[#1C1C1E] text-white transition-transform duration-300 md:relative md:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <div className="flex items-center h-16 px-6 mb-6 shrink-0">
          <h1 className="text-2xl tracking-tight text-white font-heading">TransitOps</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                "hover:bg-white/10 hover:text-white",
                isActive 
                  ? "bg-white/10 text-white border-l-4 border-primary pl-2" 
                  : "text-gray-400 border-l-4 border-transparent"
              )}
            >
              <item.icon className="flex-shrink-0 w-5 h-5 mr-3" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10 shrink-0">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-primary shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs font-medium text-gray-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
};
