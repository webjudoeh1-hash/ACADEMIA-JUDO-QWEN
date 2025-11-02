// src/components/GroupManager.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function GroupManager() {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [users, setUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchUsers();
    fetchDocuments();
  }, []);

  const fetchGroups = async () => {
    const { data, error } = await supabase.from('groups').select('*').order('name');
    if (error) {
      console.error('Error al cargar grupos:', error);
      setMessage(error.message);
    } else {
      setGroups(data);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener usuario:', error);
      setMessage(error.message);
      return;
    }
    const user = data.user;
    if (!user) {
      setMessage('No estás autenticado');
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .order('username');

    if (profileError) {
      console.error('Error al cargar usuarios:', profileError);
      setMessage(profileError.message);
    } else {
      setUsers(profiles);
    }
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase.from('private_content').select('id, title').order('title');
    if (error) {
      console.error('Error al cargar documentos:', error);
      setMessage(error.message);
    } else {
      setDocuments(data);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name) {
      setMessage('El nombre del grupo es obligatorio');
      return;
    }

    const { error } = await supabase.from('groups').insert(newGroup);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Grupo creado exitosamente');
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    }
  };

  const addMember = async () => {
    if (!selectedGroup || !selectedUser) {
      setMessage('Selecciona un grupo y un usuario');
      return;
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: selectedGroup,
      user_id: selectedUser,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Miembro agregado exitosamente');
      fetchMembers(selectedGroup);
    }
  };

  const removeMember = async (memberId) => {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Miembro eliminado');
      fetchMembers(selectedGroup);
    }
  };

  const fetchMembers = async (groupId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, user:profiles(username, email)')
      .eq('group_id', groupId);

    if (error) {
      console.error('Error al cargar miembros:', error);
      setMessage(error.message);
    } else {
      setMembers(data);
    }
  };

  const handleGroupSelect = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    if (groupId) fetchMembers(groupId);
    else setMembers([]);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestión de Grupos</h2>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      {/* Crear grupo */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Crear Nuevo Grupo</h3>
        <input
          type="text"
          placeholder="Nombre del grupo"
          value={newGroup.name}
          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
          className="block w-full p-2 mb-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Descripción"
          value={newGroup.description}
          onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
          className="block w-full p-2 mb-2 border border-gray-300 rounded"
        />
        <button
          onClick={createGroup}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Crear Grupo
        </button>
      </div>

      {/* Asignar miembros */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Asignar Miembros a Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={selectedGroup}
            onChange={handleGroupSelect}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username || u.email}
              </option>
            ))}
          </select>
          <button
            onClick={addMember}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Agregar al Grupo
          </button>
        </div>

        {/* Lista de miembros */}
        {members.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Miembros del Grupo:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{m.user.username || m.user.email}</span>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Asignar documentos a grupos */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Asignar Documentos a Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un documento</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <button
            onClick={async () => {
              if (!selectedGroup || !selectedDocument) {
                setMessage('Selecciona un grupo y un documento');
                return;
              }
              const { error } = await supabase
                .from('private_content')
                .update({ group_id: selectedGroup })
                .eq('id', selectedDocument);

              if (error) setMessage(error.message);
              else {
                setMessage('Documento asignado al grupo');
                setSelectedDocument('');
              }
            }}
            className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            Asignar Documento
          </button>
        </div>
      </div>
    </div>
  );
}
