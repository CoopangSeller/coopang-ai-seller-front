import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-20">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <p className="text-lg font-medium text-white">
          이 서비스는 쿠팡 상품기획 · AI 콘텐츠 제작 워크플로우를 돕기 위해
          제작되었습니다.
        </p>
        <p className="text-sm text-slate-400">
          아래 도구들과 함께 사용하면 상품 기획부터 썸네일 제작까지 훨씬
          빨라집니다.
        </p>

        <div className="flex flex-wrap justify-center gap-6 pt-4">
          {/* 쿠팡 윙 */}
          <a
            href="https://wing.coupang.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-red-600 rounded-lg text-white text-sm font-semibold">
              Coupang Wing
            </span>
            <span>상품 등록 · 판매 관리</span>
          </a>

          {/* ChatGPT */}
          <a
            href="https://chat.openai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-emerald-600 rounded-lg text-white text-sm font-semibold">
              ChatGPT
            </span>
            <span>상품명 · 상세페이지 기획</span>
          </a>

          {/* Adobe Photoshop */}
          <a
            href="https://www.adobe.com/products/photoshop.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-blue-600 rounded-lg text-white text-sm font-semibold">
              Photoshop
            </span>
            <span>썸네일 · 상세 이미지 편집</span>
          </a>
        </div>

        <div className="pt-8 border-t border-slate-800 mt-8 text-xs text-slate-500">
          © 2026 AI Product Workflow Tools. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
