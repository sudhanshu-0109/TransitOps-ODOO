import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });
};
