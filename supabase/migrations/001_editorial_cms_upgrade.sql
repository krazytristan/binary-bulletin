-- ============================================================================
-- The Binary Bulletin — Complete Digital Newsroom & Editorial CMS Migration
-- Run this script once in the Supabase SQL Editor (Project -> SQL Editor).
-- It is idempotent (safe to re-run) and preserves all existing data.
-- ============================================================================

-- 1. EXTEND PROFILES FOR 9 EDITORIAL ROLES & CONTRIBUTOR MANAGEMENT
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS assigned_section text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. EXTEND ARTICLES FOR FULL CMS, SEO & EDITORIAL WORKFLOW
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS subheadline text,
  ADD COLUMN IF NOT EXISTS editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS editor_name text,
  ADD COLUMN IF NOT EXISTS image_caption text,
  ADD COLUMN IF NOT EXISTS image_credit text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_breaking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure existing articles default cleanly
UPDATE public.articles SET views = 0 WHERE views IS NULL;

-- 3. EXTEND CATEGORIES FOR DYNAMIC PUBLICATION SECTIONS
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS featured_image text,
  ADD COLUMN IF NOT EXISTS editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;

-- Seed recommended campus publication sections if not present
INSERT INTO public.categories (name, description, slug, sort_order, is_active)
SELECT v.name, v.description, v.slug, v.sort_order, true
FROM (VALUES
  ('News', 'Official campus reporting and breaking news', 'news', 1),
  ('Feature', 'In-depth campus stories and student profiles', 'feature', 2),
  ('Opinion', 'Student perspectives and commentary', 'opinion', 3),
  ('Sports', 'Campus athletics and intramural coverage', 'sports', 4),
  ('Literary', 'Campus poetry, prose, and creative writing', 'literary', 5),
  ('Special Reports', 'Investigative and special campus series', 'special-reports', 6)
) AS v(name, description, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE lower(c.name) = lower(v.name)
);

-- 4. ARTICLE REVISIONS (VERSION HISTORY)
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  title text NOT NULL,
  subheadline text,
  excerpt text,
  content text,
  status text,
  edited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  edited_by_name text,
  revision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. INTERNAL EDITORIAL COMMENTS & WORKFLOW APPROVAL HISTORY
CREATE TABLE IF NOT EXISTS public.editorial_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text,
  comment text NOT NULL,
  comment_type text NOT NULL DEFAULT 'review_note', -- review_note | revision_request | writer_response
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  actor_role text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. EXTEND COMMENTS FOR READER MODERATION & ENGAGEMENT
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT 'Campus Reader',
  ADD COLUMN IF NOT EXISTS author_email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | hidden | spam
  ADD COLUMN IF NOT EXISTS is_reported boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_reason text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- 7. EXTEND MEDIA LIBRARY FOR FOLDERS, CAPTIONS & CREDITS
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS folder text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS bucket text NOT NULL DEFAULT 'articles',
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS credit text,
  ADD COLUMN IF NOT EXISTS alt_text text;

-- 8. EXTEND NOTIFICATIONS & ACTIVITY LOGS
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS notification_type text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS link text;

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS details text;

-- 9. WEBSITE & HOMEPAGE SETTINGS (SINGLETON ROW 'default')
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  publication_name text NOT NULL DEFAULT 'The Binary Bulletin',
  publication_tagline text NOT NULL DEFAULT 'Official Student Publication of AMA Computer College Lipa Campus',
  publication_description text NOT NULL DEFAULT 'The official student publication of AMA Computer College Lipa Campus, committed to accurate, ethical, and student-centered campus journalism.',
  institution_name text NOT NULL DEFAULT 'AMA Computer College Lipa Campus',
  logo_url text DEFAULT '/binary-logo.png',
  favicon_url text DEFAULT '/binary-logo.png',
  primary_color text DEFAULT '#1E3A8A',
  accent_color text DEFAULT '#FBBF24',
  secondary_color text DEFAULT '#7F1D1D',
  seo_title text DEFAULT 'The Binary Bulletin | Official Student Publication of AMA Computer College Lipa Campus',
  seo_description text DEFAULT 'Campus news, features, editorials, official announcements, and events from AMA Computer College Lipa Campus.',
  facebook_url text DEFAULT 'https://web.facebook.com/profile.php?id=61581010768762',
  twitter_url text DEFAULT '',
  instagram_url text DEFAULT '',
  youtube_url text DEFAULT '',
  contact_email text DEFAULT 'binarybulletin@ama.edu.ph',
  contact_address text DEFAULT 'Lipa City, Batangas',
  breaking_news_enabled boolean NOT NULL DEFAULT false,
  breaking_news_text text DEFAULT '',
  breaking_news_link text DEFAULT '',
  featured_article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  homepage_config jsonb NOT NULL DEFAULT '{"showEditorial": true, "showVoices": true, "showBulletins": true, "showEvents": true, "showVideos": true, "showArchives": true, "showNewsletter": true, "aboutMission": "", "editorialBoard": []}'::jsonb,
  default_article_status text NOT NULL DEFAULT 'draft',
  comment_moderation text NOT NULL DEFAULT 'pre_moderate', -- pre_moderate | auto_approve | disabled
  allow_public_registration boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Asia/Manila',
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text DEFAULT 'The Binary Bulletin is undergoing scheduled editorial maintenance. Please check back shortly.',
  privacy_policy text DEFAULT '',
  terms_of_use text DEFAULT '',
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 10. PAGE VIEWS ANALYTICS LOG
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. HELPER FUNCTION FOR ROLE-BASED ACCESS CONTROL (RBAC)
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true),
    'none'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editorial_leader()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_staff_role() IN (
    'admin', 'Super Admin', 'Editor-in-Chief', 'Managing Editor', 'News Editor', 'Adviser'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_staff_role() IN ('admin', 'Super Admin', 'Editor-in-Chief');
$$;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Public read access for site_settings & approved comments
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
CREATE POLICY "Admins manage site_settings" ON public.site_settings
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Page views: public can insert view events, authenticated staff can read
DROP POLICY IF EXISTS "Public insert page_views" ON public.page_views;
CREATE POLICY "Public insert page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff read page_views" ON public.page_views;
CREATE POLICY "Staff read page_views" ON public.page_views
  FOR SELECT USING (auth.role() = 'authenticated');

-- Revisions, editorial comments, approval history: authenticated staff only
DROP POLICY IF EXISTS "Staff manage article_revisions" ON public.article_revisions;
CREATE POLICY "Staff manage article_revisions" ON public.article_revisions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff manage editorial_comments" ON public.editorial_comments;
CREATE POLICY "Staff manage editorial_comments" ON public.editorial_comments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff manage approval_history" ON public.approval_history;
CREATE POLICY "Staff manage approval_history" ON public.approval_history
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Comments: public can read approved comments & submit new comments; editorial staff can moderate
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved comments" ON public.comments;
CREATE POLICY "Public read approved comments" ON public.comments
  FOR SELECT USING (status = 'approved' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff moderate comments" ON public.comments;
CREATE POLICY "Staff moderate comments" ON public.comments
  FOR UPDATE USING (public.is_editorial_leader()) WITH CHECK (public.is_editorial_leader());

DROP POLICY IF EXISTS "Staff delete comments" ON public.comments;
CREATE POLICY "Staff delete comments" ON public.comments
  FOR DELETE USING (public.is_editorial_leader());

-- Safe atomic view increment RPC for public article reads
CREATE OR REPLACE FUNCTION public.increment_article_views(target_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = target_article_id;
END;
$$;
