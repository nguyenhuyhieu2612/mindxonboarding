import useApiHealth from "@/hooks/use-api-health";
import PrivateRoute from "./components/protected-route";
import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/main-layout";
import { paths } from "./constants";
import Login from "@/screens/login";
import Home from "@/screens/home";
import FAQ from "@/screens/faq";
import Profile from "@/screens/profile";

export default function App() {
  useApiHealth();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#122118] dark group/design-root overflow-x-hidden">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={paths.login} element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path={paths.home} element={<Home />} />
            <Route path={paths.faq} element={<FAQ />} />
            <Route path={paths.profile} element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
