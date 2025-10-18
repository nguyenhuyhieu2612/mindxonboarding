import useLogin from "@/hooks/use-login";

export const Login = () => {
  const { actions, loading, error } = useLogin();

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col w-[512px] py-5 max-w-[960px] flex-1">
        <h2 className="text-white tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
          Welcome back
        </h2>
        {error && (
          <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
            {error}
          </p>
        )}
        <div className="flex px-4 py-3 justify-center">
          <button
            onClick={actions.handleLoginWithGoogle}
            disabled={loading}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#38e078] text-[#111714] text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
