import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <h1 className="text-[#1b0d0d] tracking-light text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">
          Hi {user?.userId}
        </h1>
        <p className="text-[#1b0d0d] text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
          You have successfully logged in. Explore our courses and resources to
          enhance your skills.
        </p>
      </div>
    </div>
  );
}
