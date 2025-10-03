import MainLayout from "@/layouts/main-layout";
import Login from "@/screens/login";
import useApiHealth from "@/hooks/use-api-health";

export default function App() {
  useApiHealth();
  window.alert("Sau khi thêm CICD Pipline");
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-50 group/design-root overflow-x-hidden">
      <h1>Đây là thông báo sau khi thêm CICI Pipeline blablablabla</h1> ## New
      line added for CI/CD pipeline integration
      <MainLayout>
        <Login />
      </MainLayout>
    </div>
  );
}
