import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function UserPanel() {
  const [files, setFiles] = useState([]);

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

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('private-content').download(filePath);
    if (error) {
      console.error('Error al descargar archivo:', error);
      return;
    }
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      a.click();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Contenido Disponible</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{file.title}</h3>
              <p className="text-sm text-gray-600">{file.description}</p>
              <button
                onClick={() => downloadFile(file.file_path)}
                className="mt-2 bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
              >
                Descargar
              </button>
            </div>
          ))
        ) : (
          <p>No hay contenido disponible.</p>
        )}
      </div>
    </div>
  );
}