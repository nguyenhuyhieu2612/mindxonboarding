import React from "react";
import { useAppSelector } from "@/store/hooks";
import { aboutMindXFAQ, courseMindXFAQ } from "@/constants";
import { useGA4 } from "@/hooks/use-ga4";
import { useAI } from "@/hooks/use-ai";

export const FAQ = () => {
  const [search, setSearch] = React.useState("");

  const { user } = useAppSelector((state) => state.auth);
  const { trackEvent: trackGA4Event } = useGA4();
  const { trackEvent: trackAIEvent } = useAI();

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length > 2) {
      trackGA4Event("search", {
        search_term: value,
        page: "faq",
      });
      trackAIEvent("FAQSearch", {
        UserId: user!.id.toString(),
        Page: "FAQ",
        Feature: "FAQ",
        SearchTerm: value,
      });
    }
  };

  const handleFAQExpand = (question: string, category: string) => {
    trackGA4Event("ui_button_click", {
      button_name: "faq_expand",
      page: "faq",
      category,
      question,
    });
    trackAIEvent("FAQExpand", {
      UserId: user!.id.toString(),
      Page: "FAQ",
      Feature: "FAQ",
      Category: category,
      Question: question,
    });
  };

  return (
    <div className="px-40 flex flex-1 justify-center py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
            Câu hỏi thường gặp
          </p>
        </div>
        <div className="px-4 py-3">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div
                className="text-[#96c5a8] flex border-none bg-[#264532] items-center justify-center pl-4 rounded-l-lg border-r-0"
                data-icon="MagnifyingGlass"
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
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                placeholder="Tìm kiếm câu hỏi"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#264532] focus:border-none h-full placeholder:text-[#96c5a8] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                type="text"
                name="search"
              />
            </div>
          </label>
        </div>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Về MindX
        </h2>
        <div className="flex flex-col p-4 gap-3">
          {aboutMindXFAQ.map((item) => (
            <details
              key={item.id}
              className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group"
            >
              <summary
                className="flex cursor-pointer items-center justify-between gap-6 py-2"
                onClick={() => handleFAQExpand(item.question, item.category)}
              >
                <p className="text-white text-sm font-medium leading-normal">
                  {item.question}
                </p>
                <div
                  className="text-white group-open:rotate-180"
                  data-icon="CaretDown"
                  data-size="20px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20px"
                    height="20px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                  </svg>
                </div>
              </summary>
              <p className="text-[#96c5a8] text-sm font-normal leading-normal pb-2">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Khóa học
        </h2>
        <div className="flex flex-col p-4 gap-3">
          {courseMindXFAQ.map((item) => (
            <details
              key={item.id}
              className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group"
            >
              <summary
                className="flex cursor-pointer items-center justify-between gap-6 py-2"
                onClick={() => handleFAQExpand(item.question, item.category)}
              >
                <p className="text-white text-sm font-medium leading-normal">
                  {item.question}
                </p>
                <div
                  className="text-white group-open:rotate-180"
                  data-icon="CaretDown"
                  data-size="20px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20px"
                    height="20px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                  </svg>
                </div>
              </summary>
              <p className="text-[#96c5a8] text-sm font-normal leading-normal pb-2">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};
