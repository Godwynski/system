-- Create a secure schema for auth operations if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Define user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'librarian', 'staff', 'student');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role NOT NULL DEFAULT 'student'::public.user_role,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Profiles are viewable by everyone in the system (or you could restrict this)
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile EXCEPT the role
-- We need to make sure regular users can't elevate their own role
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (
      -- If they are trying to change their role, it must remain what it currently is
      -- unless they are an admin (handled by a separate policy)
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 4. Admins have full access to all profiles
CREATE POLICY "Admins have full access." ON public.profiles
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role 
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::public.user_role
  );

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
