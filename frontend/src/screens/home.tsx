import React from "react";
import { useAppSelector } from "@/store/hooks";
import { trackPageView, trackEvent, trackUserAction } from "@/app-insights";

export default function Home() {
  const { user } = useAppSelector((state) => state.auth);

  const [clickCount, setClickCount] = React.useState(0);

  React.useEffect(() => {
    trackPageView("Home");
    trackEvent("page_view", {
      pageName: "Home",
      pageType: "dashboard",
      userId: user?.id?.toString() || "unknown",
      userName: user?.name || "unknown",
    });
  }, [user]);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    trackUserAction("button_click", {
      buttonName: "Click Me",
      clickCount: newCount.toString(),
      userId: user?.id?.toString() || "unknown",
    });
  };

  const throwError = () => {
    throw Error(`This is a test error ${clickCount}`);
  };
  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Click the button below to see the magic happen.
        </p>
        <div className="flex justify-center">
          <div className="flex flex-1 gap-3 max-w-[480px] flex-col items-stretch px-4 py-3">
            <button
              onClick={handleClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#39e079] text-[#122118] text-sm font-bold leading-normal tracking-[0.015em] w-full"
            >
              <span className="truncate">Click Me!</span>
            </button>
            <button
              onClick={throwError}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#264532] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full"
            >
              <span className="truncate">Thow A Error {clickCount}</span>
            </button>
          </div>
        </div>
        <p className="text-[#96c5a8] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Number of clicks: {clickCount}
        </p>
      </div>
    </div>
  );
}
