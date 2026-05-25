import { useState, useEffect } from 'react';
import api from '../services/api';

export const useTeam = () => {
  const [team, setTeam] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/users');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admins = res.data.filter((u: any) => u.role?.toLowerCase() === 'admin');
        setTeam(admins);
      } catch (err) {
        console.error('Không thể lấy danh sách team:', err);
      }
    };
    fetchTeam();
  }, []);

  return { team };
};
