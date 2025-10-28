// src/pages/index.jsx
import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Academia de Judo</title>
        <meta name="description" content="Bienvenidos a la academia de judo." />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center text-blue-700">Bienvenidos a la Academia de Judo</h1>
        <p className="mt-4 text-center text-lg">Inicia sesión para acceder al contenido privado</p>
        <div className="text-center mt-8">
          <a href="/login" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">
            Iniciar Sesión
          </a>
        </div>
      </main>
    </div>
  );
}
