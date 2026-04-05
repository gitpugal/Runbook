"use client";

import {
    GitBranch,
    Settings,
    Building2,
    MailIcon,
    HomeIcon,
    DatabaseZap,
} from "lucide-react";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
    const { orgId } = useParams<{ orgId: string }>();
    const pathname = usePathname();

    const automationItems = [
        {
            title: "Organization Home",
            icon: HomeIcon,
            path: "",
        },
        {
            title: "Workflows",
            icon: GitBranch,
            path: "workflows",
        },
        {
            title: "Data",
            icon: DatabaseZap,
            path: "internal-data",
        },
        {
            title: "Settings",
            icon: Settings,
            path: "settings",
        },
    ];

    const systemItems = [
        {
            title: "Organizations",
            icon: Building2,
            path: "/org/select-org",
        },
                {
            title: "Invitations",
            icon: MailIcon,
            path: "/org/invitations",
        },
    ];

    return (
        <Sidebar className="bg-sidebar">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Automation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {automationItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            item.path === ""
                                                ? pathname === `/org/${orgId}`
                                                : pathname.startsWith(`/org/${orgId}/${item.path}`)
                                        }
                                    >
                                        <Link
                                            aria-disabled={!orgId}
                                            href={`/org/${orgId}/${item.path}`}
                                            className="flex items-center gap-3"
                                        >
                                            <item.icon size={16} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>System</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {systemItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.path}>
                                        <Link
                                            href={`${item.path}`}
                                            className="flex items-center gap-3"
                                        >
                                            <item.icon size={16} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
