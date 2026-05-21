import React from 'react';
import { ShieldCheck, Zap, ArrowRight, Database, Globe, User } from 'lucide-react';

const IntroPage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-[#37352f]">
      <div className="max-w-[700px] w-full animate-fade-in">
        <div className="flex items-center gap-4 mb-6 text-6xl">📜</div>
        <h1 className="text-5xl font-bold mb-4">The OSINT Protocol</h1>
        <p className="text-xl text-[rgba(55,53,47,0.65)] mb-10 leading-relaxed">
          Welcome to the investigative workspace. This platform correlates public data across social networks, 
          infrastructure logs, and blockchain ledgers to build a comprehensive digital profile.
        </p>

        <div className="space-y-6 mb-12">
          <GuideStep 
            emoji="🔍" 
            title="Search Anything" 
            desc="Enter a username, domain, email, or wallet address. The engine automatically detects the input type." 
          />
          <GuideStep 
            emoji="🤖" 
            title="AI Correlation" 
            desc="Our backend uses NLP to extract entities and calculate risk scores from unstructured web data." 
          />
          <GuideStep 
            emoji="🛡️" 
            title="Safe & Legal" 
            desc="We only access publicly available information. No unauthorized access or illegal scraping." 
          />
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onStart}
            className="flex items-center justify-between w-full p-4 rounded-xl border border-[rgba(55,53,47,0.1)] hover:bg-[rgba(55,53,47,0.03)] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
              </div>
              <div className="text-left">
                <div className="font-bold">Acknowledge & Start</div>
                <div className="text-xs text-[rgba(55,53,47,0.45)]">I agree to the ethical OSINT usage policy</div>
              </div>
            </div>
            <ArrowRight size={20} className="text-[rgba(55,53,47,0.3)] group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>
          
          <div className="flex items-center justify-center gap-6 mt-4 opacity-30 text-xs font-semibold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Database size={12}/> 500+ Sources</span>
            <span className="flex items-center gap-1"><Globe size={12}/> Global Node Network</span>
            <span className="flex items-center gap-1"><User size={12}/> Ethical Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GuideStep = ({ emoji, title, desc }) => (
  <div className="flex gap-4">
    <div className="text-2xl mt-1">{emoji}</div>
    <div>
      <div className="font-bold text-lg mb-1">{title}</div>
      <div className="text-sm text-[rgba(55,53,47,0.5)] leading-snug">{desc}</div>
    </div>
  </div>
);

export default IntroPage;
