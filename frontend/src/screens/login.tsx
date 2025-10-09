import useLogin from "@/hooks/use-login";

export default function Login() {
  const { actions, loading, error } = useLogin();

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
              onClick={actions.handleLoginWithMindX}
              disabled={loading}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#ea2a2a] text-[#fcf8f8] text-base font-bold leading-normal tracking-[0.015em] w-full"
            >
              <span className="truncate">Sign in with MindX account</span>
            </button>
            <button
              onClick={actions.handleLoginWithGoogle}
              disabled={loading}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#f3e7e7] text-[#1b0e0e] text-base font-bold leading-normal tracking-[0.015em] w-full"
            >
              <span className="truncate">Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
