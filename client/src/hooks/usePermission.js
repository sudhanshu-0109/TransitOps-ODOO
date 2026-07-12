import { useAuth } from '../context/AuthContext';

export const usePermission = (requiredRoles = []) => {
  const { user } = useAuth();
  
  if (!user || requiredRoles.length === 0) return true;
  return requiredRoles.includes(user.role);
};
