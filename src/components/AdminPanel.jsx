// src/components/AdminPanel.jsx
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AdminPanel({ user }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();

  // Obtener archivos al cargar el componente
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('private_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener archivos:', error);
    } else {
      setFiles(data);
    }
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
    });

    if (insertError) {
      setMessage(insertError.message);
    } else {
      setMessage('Archivo subido exitosamente');
      setFile(null);
      setTitle('');
      setDescription('');
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Panel de Administrador</h2>

      {/* Subir nuevo contenido */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
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
        <button
          onClick={handleUpload}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Subir Archivo
        </button>
        {message && <p className="mt-2 text-green-600">{message}</p>}
      </div>

      {/* Lista de archivos */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Archivos Subidos</h3>
        {files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{file.title}</h4>
                  <p className="text-sm text-gray-600">{file.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(`https://mttbktnkhjdmlqzmzpp1.supabase.co/storage/v1/object/public/private-content/${file.file_path}`, '_blank')}
                    className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => deleteFile(file.id, file.file_path)}
                    className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
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
  );
}
