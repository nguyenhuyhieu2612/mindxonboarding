import React from "react";
import Header from "@/components/header";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="layout-container flex h-full grow flex-col">
            <Header />
                {children}
        </div>
    )
}