import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  organizations: { name: string };
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          organizations (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading projects",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Projects</h2>
        <p className="text-muted-foreground">View all projects across your organizations</p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create an organization and add projects to get started
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
                <CardDescription>
                  {project.organizations.name}
                </CardDescription>
                <CardDescription className="!mt-2">
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
