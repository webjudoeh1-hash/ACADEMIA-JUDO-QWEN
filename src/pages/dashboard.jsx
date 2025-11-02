// src/pages/dashboard.jsx (versión original)
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import AdminPanel from '../components/AdminPanel';
import UserPanel from '../components/UserPanel';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {  { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error al obtener el rol:', error);
        // Si hay error, asumimos rol 'user' para evitar bloqueos
        setRole('user');
      } else {
        setRole(data?.role || 'user');
      }
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading || !user) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1>Panel de Judo</h1>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="bg-red-600 py-1 px-3 rounded hover:bg-red-700"
          >
            Salir
          </button>
        </div>
      </nav>

      <div className="container mx-auto mt-6">
        {role === 'admin' ? <AdminPanel user={user} /> : <UserPanel />}
      </div>
    </div>
  );
}
