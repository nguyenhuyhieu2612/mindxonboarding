import { useState } from "react";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  

    return (
              <div className="relative flex flex-1 items-center justify-center px-40 py-5">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div
              className="absolute inset-0 h-full w-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmF0dXJlfGVufDB8fDB8fHww&amp;auto=format&amp;fit=crop&amp;w=800&amp;q=80&quot;)" }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
            </div>
          </div>
          <div className="layout-content-container relative z-10 flex w-[512px] max-w-[512px] flex-col rounded-xl bg-white/90 p-5 py-5 backdrop-blur-md">
            <h2 className="text-[#0d171b] px-4 pb-3 pt-5 text-center text-[28px] font-bold leading-tight tracking-[-0.015em]">Đăng nhập</h2>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
<input
                  placeholder="Email"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] focus:outline-0 focus:ring-0 border border-[#cfdfe7] bg-slate-50 focus:border-[#cfdfe7] h-14 placeholder:text-[#4c809a] p-[15px] text-base font-normal leading-normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
 <input
                  placeholder="Mật khẩu"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d171b] focus:outline-0 focus:ring-0 border border-[#cfdfe7] bg-slate-50 focus:border-[#cfdfe7] h-14 placeholder:text-[#4c809a] p-[15px] text-base font-normal leading-normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>
            <p className="text-[#4c809a] pb-3 pt-1 px-4 text-sm font-normal leading-normal underline">Quên mật khẩu?</p>
            <div className="flex px-4 py-3">
              <button
                className="flex min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#13a4ec] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-slate-50 h-10"
              >
                <span className="truncate">Đăng nhập</span>
              </button>
            </div>
            <p className="text-[#4c809a] pb-3 pt-1 px-4 text-center text-sm font-normal leading-normal">Hoặc</p>
            <div className="flex px-4 py-3">
              <button
                className="flex min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#e7eff3] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-[#0d171b] gap-2 pl-4 h-10"
              >
                <div className="text-[#0d171b]" data-icon="GoogleLogo" data-size="20px" data-weight="regular">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,128a96,96,0,1,1-21.95-61.09,8,8,0,1,1-12.33,10.18A80,80,0,1,0,207.6,136H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128Z"></path>
                  </svg>
                </div>
                <span className="truncate">Đăng nhập với Google</span>
              </button>
            </div>
            <p className="text-[#4c809a] pb-3 pt-1 px-4 text-center text-sm font-normal leading-normal underline">Chưa có tài khoản? Đăng ký</p>
          </div>
        </div>
    )
}