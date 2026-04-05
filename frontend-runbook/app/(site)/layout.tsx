import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import "maplibre-gl/dist/maplibre-gl.css";
import DashboardShell from "./dashboard/components/DashboardShell";
import { Toaster } from "@/components/ui/sonner";


export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await getServerSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <SidebarProvider suppressHydrationWarning={true}>
            <Toaster richColors />
            <div className="flex h-screen w-screen overflow-hidden">

                <DashboardShell>
                    {children}
                </DashboardShell>
            </div>
        </SidebarProvider>
    );
}
