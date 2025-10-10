import React from "react";
import { trackPageView, trackEvent, trackUserAction } from "@/app-insights";
import { useAppSelector } from "@/store/hooks";

export default function FAQ() {
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    trackPageView("FAQ");
    trackEvent("page_view", {
      pageName: "FAQ",
      pageType: "support",
      userId: user?.id?.toString() || "unknown",
      userName: user?.name || "unknown",
    });
  }, [user]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length > 2) {
      trackUserAction("faq_search", {
        searchQuery: value,
        userId: user?.id?.toString() || "unknown",
      });
    }
  };

  const handleFAQExpand = (question: string, category: string) => {
    trackUserAction("faq_expand", {
      question,
      category,
      userId: user?.id?.toString() || "unknown",
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
          <details
            className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group"
            open
          >
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() => handleFAQExpand("MindX là gì?", "Về MindX")}
            >
              <p className="text-white text-sm font-medium leading-normal">
                MindX là gì?
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
              MindX là một tổ chức giáo dục công nghệ, cung cấp các khóa học về
              lập trình, thiết kế, và khoa học dữ liệu cho mọi lứa tuổi.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand("MindX có những khóa học nào?", "Về MindX")
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                MindX có những khóa học nào?
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
              MindX là một tổ chức giáo dục công nghệ, cung cấp các khóa học về
              lập trình, thiết kế, và khoa học dữ liệu cho mọi lứa tuổi.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand(
                  "Làm sao để đăng ký khóa học tại MindX?",
                  "Về MindX"
                )
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                Làm sao để đăng ký khóa học tại MindX?
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
              MindX là một tổ chức giáo dục công nghệ, cung cấp các khóa học về
              lập trình, thiết kế, và khoa học dữ liệu cho mọi lứa tuổi.
            </p>
          </details>
        </div>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Khóa học
        </h2>
        <div className="flex flex-col p-4 gap-3">
          <details
            className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group"
            open
          >
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand(
                  "Khóa học lập trình tại MindX dành cho ai?",
                  "Khóa học"
                )
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                Khóa học lập trình tại MindX dành cho ai?
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
              Các khóa học lập trình tại MindX dành cho cả người mới bắt đầu và
              người đã có kinh nghiệm, từ trẻ em đến người lớn.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand("Thời gian học một khóa là bao lâu?", "Khóa học")
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                Thời gian học một khóa là bao lâu?
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
              Các khóa học lập trình tại MindX dành cho cả người mới bắt đầu và
              người đã có kinh nghiệm, từ trẻ em đến người lớn.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand("Học phí các khóa học như thế nào?", "Khóa học")
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                Học phí các khóa học như thế nào?
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
              Các khóa học lập trình tại MindX dành cho cả người mới bắt đầu và
              người đã có kinh nghiệm, từ trẻ em đến người lớn.
            </p>
          </details>
        </div>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Học phí và ưu đãi
        </h2>
        <div className="flex flex-col p-4 gap-3">
          <details
            className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group"
            open
          >
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand(
                  "MindX có những chương trình ưu đãi nào?",
                  "Học phí và ưu đãi"
                )
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                MindX có những chương trình ưu đãi nào?
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
              MindX thường xuyên có các chương trình ưu đãi cho học viên đăng ký
              sớm, học nhóm, hoặc các dịp đặc biệt. Vui lòng theo dõi trang web
              hoặc liên hệ tư vấn viên để biết thêm chi tiết.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand(
                  "Có thể thanh toán học phí theo kỳ không?",
                  "Học phí và ưu đãi"
                )
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                Có thể thanh toán học phí theo kỳ không?
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
              MindX thường xuyên có các chương trình ưu đãi cho học viên đăng ký
              sớm, học nhóm, hoặc các dịp đặc biệt. Vui lòng theo dõi trang web
              hoặc liên hệ tư vấn viên để biết thêm chi tiết.
            </p>
          </details>
          <details className="flex flex-col rounded-lg border border-[#366347] bg-[#122118] px-[15px] py-[7px] group">
            <summary
              className="flex cursor-pointer items-center justify-between gap-6 py-2"
              onClick={() =>
                handleFAQExpand(
                  "MindX có chính sách hoàn trả học phí không?",
                  "Học phí và ưu đãi"
                )
              }
            >
              <p className="text-white text-sm font-medium leading-normal">
                MindX có chính sách hoàn trả học phí không?
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
              MindX thường xuyên có các chương trình ưu đãi cho học viên đăng ký
              sớm, học nhóm, hoặc các dịp đặc biệt. Vui lòng theo dõi trang web
              hoặc liên hệ tư vấn viên để biết thêm chi tiết.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
