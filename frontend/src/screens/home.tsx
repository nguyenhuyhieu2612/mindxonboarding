import React from "react";
import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const { user } = useAppSelector((state) => state.auth);

  const [clickCount, setClickCount] = React.useState(0);

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <h2 className="text-[#1b0e0e] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-[#1b0e0e] text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Click the button below to see the magic happen.
        </p>
        <div className="flex px-4 py-3 justify-center">
          <button
            onClick={() => setClickCount(clickCount + 1)}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#ea2a2a] text-[#fcf8f8] text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Click Me!</span>
          </button>
        </div>
        <p className="text-[#994d4d] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Number of clicks: {clickCount}
        </p>
      </div>
    </div>
  );
}
