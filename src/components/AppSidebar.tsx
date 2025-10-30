import { Building2, FolderKanban, Settings, Moon, Sun, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Organizations", url: "/dashboard", icon: Building2 },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "px-2" : ""}>
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className={isCollapsed ? "" : "mr-2"} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            {theme === "dark" ? (
              <>
                <Sun className={isCollapsed ? "" : "mr-2 h-4 w-4"} />
                {!isCollapsed && "Light Mode"}
              </>
            ) : (
              <>
                <Moon className={isCollapsed ? "" : "mr-2 h-4 w-4"} />
                {!isCollapsed && "Dark Mode"}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className={isCollapsed ? "" : "mr-2 h-4 w-4"} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
