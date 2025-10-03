import Header from "@/components/header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="layout-container flex h-full grow flex-col">
      <Header />
      <Outlet />
    </div>
  );
}
