-- ============================================================
-- Lumina LMS — Sample User Seed
-- Roles: admin | librarian | staff | student
-- Password for all accounts: Password123!
--
-- HOW TO RUN: Paste into Supabase SQL Editor → Run
-- Safe to run multiple times — cleans up old seed accounts first.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  uid_admin     uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  uid_librarian uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  uid_staff     uuid := 'cccccccc-0000-0000-0000-000000000003';
  uid_student   uuid := 'dddddddd-0000-0000-0000-000000000004';

  seed_emails   text[] := ARRAY[
    'admin@lumina.test',
    'librarian@lumina.test',
    'staff@lumina.test',
    'student@lumina.test'
  ];
BEGIN

  -- ─────────────────────────────────────────────────────────
  -- 0. Clean up any previous seed run (by email)
  -- ─────────────────────────────────────────────────────────
  DELETE FROM auth.identities
    WHERE provider_id = ANY(seed_emails);

  DELETE FROM public.profiles
    WHERE id IN (
      SELECT id FROM auth.users WHERE email = ANY(seed_emails)
    );

  DELETE FROM auth.users
    WHERE email = ANY(seed_emails);


  -- ─────────────────────────────────────────────────────────
  -- 1. Insert auth.users
  -- ─────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous
  ) VALUES

    (uid_admin,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@lumina.test', crypt('Password123!', gen_salt('bf')),
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Super Admin"}',
     false, false, false),

    (uid_librarian,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'librarian@lumina.test', crypt('Password123!', gen_salt('bf')),
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Jane Librarian"}',
     false, false, false),

    (uid_staff,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'staff@lumina.test', crypt('Password123!', gen_salt('bf')),
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Mark Staff"}',
     false, false, false),

    (uid_student,
     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'student@lumina.test', crypt('Password123!', gen_salt('bf')),
     now(), now(), now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Alice Student"}',
     false, false, false);


  -- ─────────────────────────────────────────────────────────
  -- 2. Insert identities (required for email login)
  -- ─────────────────────────────────────────────────────────
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider,
    identity_data, created_at, updated_at, last_sign_in_at
  ) VALUES

    (gen_random_uuid(), uid_admin, 'admin@lumina.test', 'email',
     jsonb_build_object('sub', uid_admin::text, 'email', 'admin@lumina.test', 'email_verified', true),
     now(), now(), now()),

    (gen_random_uuid(), uid_librarian, 'librarian@lumina.test', 'email',
     jsonb_build_object('sub', uid_librarian::text, 'email', 'librarian@lumina.test', 'email_verified', true),
     now(), now(), now()),

    (gen_random_uuid(), uid_staff, 'staff@lumina.test', 'email',
     jsonb_build_object('sub', uid_staff::text, 'email', 'staff@lumina.test', 'email_verified', true),
     now(), now(), now()),

    (gen_random_uuid(), uid_student, 'student@lumina.test', 'email',
     jsonb_build_object('sub', uid_student::text, 'email', 'student@lumina.test', 'email_verified', true),
     now(), now(), now());


  -- ─────────────────────────────────────────────────────────
  -- 3. Insert profiles with roles
  -- ─────────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, role, full_name, updated_at)
  VALUES
    (uid_admin,     'admin',     'Super Admin',    now()),
    (uid_librarian, 'librarian', 'Jane Librarian', now()),
    (uid_staff,     'staff',     'Mark Staff',     now()),
    (uid_student,   'student',   'Alice Student',  now())
  ON CONFLICT (id) DO UPDATE
    SET role       = EXCLUDED.role,
        full_name  = EXCLUDED.full_name,
        updated_at = now();

END $$;
