-- Fix search_path for security definer functions (with CASCADE)
DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

DROP FUNCTION IF EXISTS public.can_access_project(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.can_access_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
    WHERE p.id = _project_id AND om.user_id = _user_id
  )
$$;

-- Recreate policies that were dropped
CREATE POLICY "Users can view orgs they belong to"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Org members can update their org"
  ON public.organizations FOR UPDATE
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Users can view members of their orgs"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view projects"
  ON public.projects FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update projects"
  ON public.projects FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Project members can view issues"
  ON public.issues FOR SELECT
  USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can create issues"
  ON public.issues FOR INSERT
  WITH CHECK (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can update issues"
  ON public.issues FOR UPDATE
  USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can delete issues"
  ON public.issues FOR DELETE
  USING (public.can_access_project(auth.uid(), project_id));