import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-6xl font-bold tracking-tighter">Issue Hub</h1>
        <p className="text-xl text-muted-foreground">
          Minimal, powerful issue tracking for your coding projects
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
