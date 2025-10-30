import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Bug, Lightbulb, Wrench, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type IssueStatus = "open" | "in_progress" | "closed";
type IssuePriority = "low" | "medium" | "high" | "urgent";
type IssueType = "bug" | "feature" | "improvement" | "task";

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  created_at: string;
  assigned_to: string | null;
  assigned_profile?: { display_name: string | null; email: string } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

const issueTypeIcons = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Wrench,
  task: ListTodo,
};

const statusColors = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
};

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "task" as IssueType,
    priority: "medium" as IssuePriority,
    status: "open" as IssueStatus,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProjectAndIssues();
    }
  }, [projectId]);

  const loadProjectAndIssues = async () => {
    try {
      const [projectResult, issuesResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("issues")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
      ]);

      if (projectResult.error) throw projectResult.error;
      if (issuesResult.error) throw issuesResult.error;

      setProject(projectResult.data);
      
      // Fetch profiles for assigned issues
      const issuesWithProfiles = await Promise.all(
        (issuesResult.data || []).map(async (issue) => {
          if (issue.assigned_to) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, email")
              .eq("id", issue.assigned_to)
              .single();
            return { ...issue, assigned_profile: profile };
          }
          return issue;
        })
      );
      
      setIssues(issuesWithProfiles);
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

  const createIssue = async () => {
    if (!formData.title.trim() || !user || !projectId) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from("issues")
        .insert({
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          created_by: user.id,
        });

      if (error) throw error;

      toast({ title: "Issue created!" });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "task",
        priority: "medium",
        status: "open",
      });
      loadProjectAndIssues();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating issue",
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

  if (!project) {
    return <div>Project not found</div>;
  }

  const Icon = issueTypeIcons[formData.type];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-muted-foreground">{project.description || "No description"}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Issue</DialogTitle>
                <DialogDescription>
                  Create a new bug, feature, or task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Issue title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as IssueType })}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as IssuePriority })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as IssueStatus })}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createIssue} disabled={creating || !formData.title.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {issues.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <CardTitle>No issues yet</CardTitle>
            <p className="text-muted-foreground">Create your first issue to start tracking work</p>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => {
            const TypeIcon = issueTypeIcons[issue.type];
            return (
              <Card key={issue.id} className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <TypeIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2">{issue.title}</h3>
                      {issue.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {issue.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={statusColors[issue.status]}>
                          {issue.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[issue.priority]}>
                          {issue.priority}
                        </Badge>
                        <Badge variant="outline">
                          {issue.type}
                        </Badge>
                        {issue.assigned_profile && (
                          <Badge variant="outline">
                            {issue.assigned_profile.display_name || issue.assigned_profile.email}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
