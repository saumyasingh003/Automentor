"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardCommand from "./dashboardCommand";

export const DashboardNavbar = () => {
  const [commandOpen, setCommandOpen] = useState(false);
  const { state, toggleSidebar, isMobile } = useSidebar();

 
  useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setCommandOpen((open) => !open);
    }
  };

  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);




  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      <nav className="flex px-4 gap-x-2 items-center py-3 border-b bg-white">
        <Button className="size-9 " variant="outline" onClick={toggleSidebar}>
          {state === "collapsed" || isMobile ? (
            <PanelLeftIcon />
          ) : (
            <PanelLeftCloseIcon />
          )}
        </Button>
        <Button
          className="h-9 w-[280px] justify-start font-normal text-muted-foreground  hover:text-muted-foreground"
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen((open) => !open)}
        >
          <SearchIcon />
          Search
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-none text-[10px]">
            <span className="text-xs">&times;</span>
          </kbd>
        </Button>
      </nav>
    </>
  );
};

export default DashboardNavbar;
