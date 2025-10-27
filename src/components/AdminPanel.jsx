import { useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AdminPanel({ user }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef();

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
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Panel de Administrador</h2>
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
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
    </div>
  );
}