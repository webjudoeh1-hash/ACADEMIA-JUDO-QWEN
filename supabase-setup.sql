-- 1. Crear tipo de rol para usuarios
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 2. Crear tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS) en la tabla de perfiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso para la tabla de perfiles
-- Solo el usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Solo administradores pueden ver todos los perfiles
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Solo administradores pueden crear/editar perfiles
CREATE POLICY "Admin can manage profiles" ON profiles
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- 5. Crear tabla para contenido privado
CREATE TABLE private_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' o 'document'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilitar RLS en la tabla de contenido privado
ALTER TABLE private_content ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acceso para la tabla de contenido
-- Solo administradores pueden subir y eliminar contenido
CREATE POLICY "Admin can upload and delete content" ON private_content
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Usuarios pueden ver y descargar contenido
CREATE POLICY "Users can view content" ON private_content
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid()
));

-- 8. Crear bucket de almacenamiento (esto se hace desde el panel de Supabase)
-- Ve a la pestaña "Storage" y crea un bucket llamado "private-content".

-- 9. Políticas de acceso para el bucket de almacenamiento
-- Solo usuarios autenticados pueden ver archivos
CREATE POLICY "Allow authenticated users to read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'private-content');

-- Solo administradores pueden subir/eliminar archivos
CREATE POLICY "Allow admin to upload/delete" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'private-content'
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 10. Función para insertar automáticamente un perfil al crear un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Disparador para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
