import React from "react";
import { useAppSelector } from "@/store/hooks";
import { useGA4 } from "@/hooks/use-ga4";
import { useAI } from "@/hooks/use-ai";

export const Home = () => {
  const [clickCount, setClickCount] = React.useState(0);

  const { user } = useAppSelector((state) => state.auth);
  const { trackEvent: trackGA4Event } = useGA4();
  const { trackEvent: trackAIEvent, trackException: trackAIException } =
    useAI();

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    trackGA4Event("ui_button_click", {
      button_name: "click_me",
      component: "home",
      click_count: newCount.toString(),
    });
    trackAIEvent("ButtonClick", {
      UserId: user!.id.toString(),
      Page: "home",
      Feature: "HomeButton",
      ButtonName: "ClickMe",
      ClickCount: newCount.toString(),
    });
    if (newCount % 10 === 0) {
      trackGA4Event("ui_button_click_10_times", {
        button_name: "click_me",
        total_clicks: newCount.toString(),
        component: "home",
      });
    }
  };

  const throwError = () => {
    try {
      trackGA4Event("ui_button_click", {
        button_name: "throw_error",
        page: "home",
        click_count: clickCount.toString(),
      });
      trackAIEvent("ButtonClick", {
        UserId: user!.id.toString(),
        Page: "home",
        Feature: "HomeButton",
        ButtonName: "ThrowError",
        ClickCount: clickCount.toString(),
      });
      throw Error(`This is a test error ${clickCount}`);
    } catch (error) {
      trackGA4Event("frontend_error", {
        error_type: "ui_error",
        message: (error as Error).message,
        component: "home",
        fatal: false,
      });
      trackAIException(error as Error, {
        Page: "home",
        Component: "Home",
        Fatal: "false",
        UserId: user!.id.toString(),
      });
    }
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
              <span className="truncate">Throw A Error {clickCount}</span>
            </button>
          </div>
        </div>

        <p className="text-[#96c5a8] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Number of clicks: {clickCount}
        </p>
      </div>
    </div>
  );
};
