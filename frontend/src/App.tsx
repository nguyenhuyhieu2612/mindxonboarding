import MainLayout from "@/layouts/main-layout";
import Login from "@/screens/login";
import useApiHealth from "@/hooks/use-api-health";
import { Route, Routes } from "react-router-dom";
import { paths } from "./constants";
import Home from "@/screens/home";
import PrivateRoute from "./components/protected-route";

export default function App() {
  useApiHealth();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-50 group/design-root overflow-x-hidden">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={paths.login} element={<Login />} />
          {/* <Route element={<PrivateRoute />}> */}
          <Route path={paths.home} element={<Home />} />
          {/* </Route> */}
        </Route>
      </Routes>
    </div>
  );
}
