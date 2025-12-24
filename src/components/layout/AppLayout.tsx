"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";
import { LayoutProvider, useLayout } from "./LayoutContext";

// Pages that should NOT show the sidebar
const noSidebarPages = ["/auth/signin", "/auth/verify-request", "/auth/error"];

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isSidebarCollapsed } = useLayout();
    const showSidebar = !noSidebarPages.some((page) => pathname.startsWith(page));

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-gray-950">
            <Sidebar />
            <main
                className="flex-1 transition-all duration-300 ease-in-out p-6"
                style={{ marginLeft: isSidebarCollapsed ? "72px" : "240px" }}
            >
                <Breadcrumbs />
                {children}
            </main>
        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <LayoutProvider>
            <LayoutContent>{children}</LayoutContent>
        </LayoutProvider>
    );
}
