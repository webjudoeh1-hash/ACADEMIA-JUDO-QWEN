// src/components/AdminPanel.jsx
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import GroupManager from './GroupManager';

export default function AdminPanel({ user }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    fetchFiles();
    fetchGroups();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('private_content')
      .select('*, group:groups(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener archivos:', error);
      setMessage(error.message);
    } else {
      setFiles(data);
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase.from('groups').select('*').order('name');
    if (error) console.error('Error al cargar grupos:', error);
    else setGroups(data);
  };

  const handleUpload = async () => {
    if (!file || !title) {
      setMessage('Por favor, selecciona un archivo y escribe un título.');
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('private-content')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { error: insertError } = await supabase.from('private_content').insert({
      user_id: user.id,
      title,
      description,
      file_path: fileName,
      file_type: file.type.startsWith('image') ? 'image' : 'document',
      group_id: selectedGroup || null,
    });

    if (insertError) {
      setMessage(insertError.message);
    } else {
      setMessage('Archivo subido exitosamente');
      setFile(null);
      setTitle('');
      setDescription('');
      setSelectedGroup('');
      fileInputRef.current.value = '';
      fetchFiles(); // Refrescar lista
    }
  };

  const deleteFile = async (id, filePath) => {
    // Eliminar del almacenamiento
    const { error: storageError } = await supabase.storage
      .from('private-content')
      .remove([filePath]);

    if (storageError) {
      setMessage(storageError.message);
      return;
    }

    // Eliminar de la base de datos
    const { error: dbError } = await supabase
      .from('private_content')
      .delete()
      .eq('id', id);

    if (dbError) {
      setMessage(dbError.message);
    } else {
      setMessage('Archivo eliminado exitosamente');
      fetchFiles(); // Refrescar lista
    }
  };

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('private-content')
      .download(filePath);

    if (error) {
      setMessage(error.message);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop();
    a.click();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Panel de Administrador</h2>

      {/* Mensaje de feedback */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      {/* Tabs para separar funcionalidades */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => document.getElementById('upload-section').classList.remove('hidden')}
            className="px-3 py-2 font-medium text-blue-600 border-b-2 border-blue-600"
          >
            Subir Documentos
          </button>
          <button
            onClick={() => {
              document.getElementById('upload-section').classList.add('hidden');
              document.getElementById('groups-section').classList.remove('hidden');
            }}
            className="px-3 py-2 font-medium text-gray-500 hover:text-gray-700"
          >
            Gestión de Grupos
          </button>
        </nav>
      </div>

      {/* Sección de subida */}
      <div id="upload-section" className="mb-8">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Subir Nuevo Contenido</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 block w-full"
          />
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full p-2 mb-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full p-2 mb-2 border border-gray-300 rounded"
          />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="block w-full p-2 mb-2 border border-gray-300 rounded"
          >
            <option value="">Sin grupo (visible para todos)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleUpload}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Subir Archivo
          </button>
        </div>

        {/* Lista de archivos */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Archivos Subidos</h3>
          {files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="bg-white p-4 rounded-lg shadow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{file.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{file.description}</p>
                      {file.group && <p className="text-xs text-gray-500">Grupo: {file.group.name}</p>}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-block w-3 h-3 rounded-full ${file.file_type === 'image' ? 'bg-green-500' : 'bg-blue-500'}`} title={file.file_type}></span>
                    </div>
                  </div>
                  <div className="mt-auto flex space-x-2">
                    <button
                      onClick={() => downloadFile(file.file_path)}
                      className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-sm"
                    >
                      Descargar
                    </button>
                    <button
                      onClick={() => deleteFile(file.id, file.file_path)}
                      className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay archivos subidos.</p>
          )}
        </div>
      </div>

      {/* Sección de grupos */}
      <div id="groups-section" className="hidden">
        <GroupManager />
      </div>
    </div>
  );
}