import { paths } from "./constants";
import MainLayout from "@/layouts/main-layout";
import { Route, Routes } from "react-router-dom";
import useApiHealth from "@/hooks/use-api-health";
import PrivateRoute from "./components/protected-route";
import { FAQ, Home, Login } from "@/screens";
import { useGA4PageTracking } from "./hooks/use-ga4-page-tracking";

export default function App() {
  useApiHealth();
  useGA4PageTracking();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#122118] dark group/design-root overflow-x-hidden">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={paths.login} element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path={paths.home} element={<Home />} />
            <Route path={paths.faq} element={<FAQ />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
