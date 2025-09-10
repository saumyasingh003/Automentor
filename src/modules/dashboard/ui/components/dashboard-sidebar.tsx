"use client";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FaStar } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import { RiRobot3Fill } from "react-icons/ri";
import { Info} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashboarduserbutton";

const firstSection = [
  {
    icon: Info,
    label: "About",
  href: "/dashboard/about",
  },
  {
    icon: IoVideocam,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: RiRobot3Fill,
    label: "Agents",
    href: "/agents",
  },

];

const secondSection = [
  {
    icon: FaStar,
    label: "Upgrade Now",
    href: "/upgrade",
  },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  return (
    <Sidebar className="">
      <SidebarHeader className="text-sidebar-accent-sidebar">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image
            src="/bot.png"
            alt="Logo"
            width={100}
            height={100}
            className="transition-transform duration-300 hover:scale-150 active:scale-165"
          />

          <span className="text-xl font-bold text-[#519872] relative top-5 right-4">
            AutoMentor
          </span>
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="opacity-90 text-black" />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5B6B68]/10",
                      pathname === item.href
                        ? "bg-linear-to-r/oklch border-[#ffffff]/10"
                        : "text-sidebar-accent-icon"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-2 ">
                      <item.icon className="h-40 w-40 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 tracking-wide">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 py-2">
          <Separator className="opacity-90 text-black" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 border border-transparent hover:border-blue-400/20 transition-all duration-200",
                      pathname === item.href
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400/20 text-white"
                        : "text-sidebar-accent-icon hover:text-white"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-40 w-40" />
                      <span className="text-sm font-semibold tracking-wide">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-black">
      <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
export default DashboardSidebar;
