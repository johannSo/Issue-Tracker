import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
}

export default function OrganizationDetail() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (orgId) {
      loadOrganizationAndProjects();
    }
  }, [orgId]);

  const loadOrganizationAndProjects = async () => {
    try {
      const [orgResult, projectsResult] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", orgId).single(),
        supabase.from("projects").select("*").eq("organization_id", orgId).order("created_at", { ascending: false })
      ]);

      if (orgResult.error) throw orgResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setOrganization(orgResult.data);
      setProjects(projectsResult.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!formData.name.trim() || !user || !orgId) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from("projects")
        .insert({
          organization_id: orgId,
          name: formData.name,
          description: formData.description,
          created_by: user.id,
        });

      if (error) throw error;

      toast({ title: "Project created!" });
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      loadOrganizationAndProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
            <p className="text-muted-foreground">{organization.description || "No description"}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Create a new project to organize your issues
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Project"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this project about?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createProject} disabled={creating || !formData.name.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first project to start tracking issues
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description || "No description"}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
