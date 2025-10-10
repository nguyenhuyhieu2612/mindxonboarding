import React from "react";
import { useAppSelector } from "@/store/hooks";
import useLogout from "@/hooks/use-logout";
import {
  trackEvent,
  trackPageView,
  trackUserAction,
} from "@/app-insights";

export default function Profile() {
  const { actions } = useLogout();
  const { user } = useAppSelector((state) => state.auth);

  const [allowChange, setAllowChange] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(user!);

  React.useEffect(() => {
    trackPageView("Profile");
    trackEvent("page_view", {
      pageName: "Profile",
      pageType: "profile",
      userId: user?.id?.toString() || "unknown",
      userName: user?.name || "unknown",
    });
  }, [user]);

  const handleEditToggle = () => {
    const newState = !allowChange;
    setAllowChange(newState);
    trackUserAction("profile_edit_toggle", {
      action: newState ? "enable_edit" : "disable_edit",
      userId: user?.id?.toString() || "unknown",
    });
  };

  const handleTabClick = (tabName: string) => {
    trackUserAction("profile_tab_click", {
      tabName,
      userId: user?.id?.toString() || "unknown",
    });
  };

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="flex p-4 @container">
          <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
            <div className="flex gap-4">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32"
                style={{
                  backgroundImage: `url(${user?.avatar})`,
                }}
              ></div>
              <div className="flex flex-col justify-center">
                <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                  {user?.name}
                </p>
                <p className="text-[#96c5a8] text-base font-normal leading-normal">
                  Học viên
                </p>
                <p className="text-[#96c5a8] text-base font-normal leading-normal">
                  ID: {user?.id}
                </p>
              </div>
            </div>
            <button
              onClick={handleEditToggle}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#264532] text-white text-sm font-bold leading-normal tracking-[0.015em] w-full max-w-[480px] @[480px]:w-auto"
            >
              <span className="truncate">
                {allowChange ? "Lưu" : "Chỉnh sửa"}
              </span>
            </button>
          </div>
        </div>
        <div className="pb-3">
          <div className="flex border-b border-[#366347] px-4 gap-8">
            <a
              className="flex flex-col items-center justify-center border-b-[3px] border-b-[#39e079] text-white pb-[13px] pt-4"
              href="#"
              onClick={() => handleTabClick("Thông tin cá nhân")}
            >
              <p className="text-white text-sm font-bold leading-normal tracking-[0.015em]">
                Thông tin cá nhân
              </p>
            </a>
            <a
              className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#96c5a8] pb-[13px] pt-4"
              href="#"
              onClick={() => handleTabClick("Lịch sử học tập")}
            >
              <p className="text-[#96c5a8] text-sm font-bold leading-normal tracking-[0.015em]">
                Lịch sử học tập
              </p>
            </a>
            <a
              className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#96c5a8] pb-[13px] pt-4"
              href="#"
              onClick={() => handleTabClick("Tiến độ khóa học")}
            >
              <p className="text-[#96c5a8] text-sm font-bold leading-normal tracking-[0.015em]">
                Tiến độ khóa học
              </p>
            </a>
          </div>
        </div>
        <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Thông tin cá nhân
        </h3>
        <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
          <label className="flex flex-col min-w-40 flex-1">
            <p className="text-white text-base font-medium leading-normal pb-2">
              Họ và tên
            </p>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border border-[#366347] bg-[#1b3124] focus:border-[#366347] h-14 placeholder:text-[#96c5a8] p-[15px] text-base font-normal leading-normal"
              value={userInfo.name}
              disabled={!allowChange}
              onChange={(e) => {
                setUserInfo({ ...userInfo, name: e.target.value });
              }}
            />
          </label>
        </div>
        <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
          <label className="flex flex-col min-w-40 flex-1">
            <p className="text-white text-base font-medium leading-normal pb-2">
              Email
            </p>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border border-[#366347] bg-[#1b3124] focus:border-[#366347] h-14 placeholder:text-[#96c5a8] p-[15px] text-base font-normal leading-normal"
              value={userInfo.email}
              disabled={!allowChange}
              onChange={(e) => {
                setUserInfo({ ...userInfo, email: e.target.value });
              }}
            />
          </label>
        </div>

        <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Cài đặt tài khoản
        </h3>
        <div className="flex items-center gap-4 bg-[#122118] px-4 min-h-14 justify-between">
          <p className="text-white text-base font-normal leading-normal flex-1 truncate">
            Xóa tài khoản
          </p>
          <div className="shrink-0">
            <div
              className="text-white flex size-7 items-center justify-center"
              data-icon="CaretRight"
              data-size="24px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div
          onClick={actions.logout}
          className="flex items-center gap-4 bg-[#122118] px-4 min-h-14 justify-between"
        >
          <p className="text-white text-base font-normal leading-normal flex-1 truncate">
            Đăng xuất
          </p>
          <div className="shrink-0">
            <div
              className="text-white flex size-7 items-center justify-center"
              data-icon="CaretRight"
              data-size="24px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
