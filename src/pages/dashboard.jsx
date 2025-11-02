// src/pages/dashboard.jsx
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
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error al obtener usuario:', error);
        router.push('/login');
        return;
      }
      const user = data.user;
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Obtener rol del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener el rol:', profileError);
        setRole('user');
      } else {
        setRole(profileData?.role || 'user');
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
