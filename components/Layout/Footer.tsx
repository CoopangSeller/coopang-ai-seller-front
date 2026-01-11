
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-20">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <p className="text-lg font-medium text-white">이 앱은 AI싱크클럽의 지침으로 만들어졌습니다.</p>
        <p className="text-sm">유튜브와 쓰레드 팔로우 부탁드려요!</p>
        
        <div className="flex flex-wrap justify-center gap-6 pt-4">
          <a 
            href="https://youtube.com/@aisyncclub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-red-600 rounded-lg text-white">YouTube</span>
            <span>6K 구독자</span>
          </a>
          
          <a 
            href="https://www.threads.com/@ai_sync_club" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-slate-800 rounded-lg text-white">Threads</span>
            <span>3.7K 구독자</span>
          </a>
          
          <a 
            href="https://litt.ly/aisyncclub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span className="p-2 bg-blue-600 rounded-lg text-white">Littly</span>
            <span>공식 링크</span>
          </a>
        </div>
        
        <div className="pt-8 border-t border-slate-800 mt-8 text-xs text-slate-500">
          © 2025 AI Sync Club. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
