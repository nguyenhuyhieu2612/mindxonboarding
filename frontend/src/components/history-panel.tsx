export const HistoryPanel = () => {
  return (
    <div className="layout-content-container flex flex-col w-80">
      <div className="flex h-full min-h-[700px] flex-col justify-between bg-[#122118] p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCnmALucAAh016t16X4GavgVMbx8w3Log92yzCWttUSb9fg3v1Qgc12B4DYFOE0wZESn58zlEebBpIXpCyo0z6tOok2eavXTQ4FSF1Dm2EeYdrvjMIY2qle6dzXBEHtGrkxNMglRM4xq0KQVDATpB5yHc8vB-OCef6gNUHMOWteqRwNlmOsmESATYIAO0GdaHnBQZanyJth_VUOg-BzzoPSOFXV6wY12v8NcvV2jdE6HjVrn1cO45vBdp552LrkdViMgKzn4jgHfFg")`,
              }}
            ></div>
            <h1 className="text-white text-base font-medium leading-normal">
              Alex Bennett
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#264532]">
              <p className="text-white text-sm font-medium leading-normal">
                Unlocking AI's Potential
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                AI Tips and Tricks
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Navigating NLP Terrain
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Conference Q&amp;A Session
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Creative Writing Unleashed
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                AI Evolution Insights
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Mastering Short Conversations
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Write me this email
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Help me look through this report
              </p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <p className="text-white text-sm font-medium leading-normal">
                Future of Chatbots.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#39e079] text-[#122118] text-sm font-bold leading-normal tracking-[0.015em]">
            <span className="truncate">New Chat</span>
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2">
              <div
                className="text-white"
                data-icon="Sparkle"
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
                  <path d="M197.58,129.06l-51.61-19-19-51.65a15.92,15.92,0,0,0-29.88,0L78.07,110l-51.65,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0l19-51.61,51.65-19a15.92,15.92,0,0,0,0-29.88ZM140.39,163a15.87,15.87,0,0,0-9.43,9.43l-19,51.46L93,172.39A15.87,15.87,0,0,0,83.61,163h0L32.15,144l51.46-19A15.87,15.87,0,0,0,93,115.61l19-51.46,19,51.46a15.87,15.87,0,0,0,9.43,9.43l51.46,19ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"></path>
                </svg>
              </div>
              <p className="text-white text-sm font-medium leading-normal">
                Upgrade
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
