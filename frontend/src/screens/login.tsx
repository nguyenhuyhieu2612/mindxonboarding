import useMindXLogin from "@hooks/use-mindx-login";

export default function Login() {
  const { actions, error } = useMindXLogin();

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col w-[512px] py-5 max-w-[960px] flex-1">
        <h2 className="text-[#1b0d0d] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          Welcome back
        </h2>
        {error && typeof error === "string" && (
          <p className="text-[#9a4c4c] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
            {error}
          </p>
        )}
        <div className="flex justify-center">
          <div className="flex flex-1 gap-3 max-w-[480px] flex-col items-stretch px-4 py-3">
            <button
              onClick={actions.handleMindXLogin}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#ec1313] text-[#fcf8f8] text-base font-bold leading-normal tracking-[0.015em] w-full"
            >
              <span className="truncate">Sign in with MindX account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
