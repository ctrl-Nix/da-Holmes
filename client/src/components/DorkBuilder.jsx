import React, { useState } from 'react';

const DorkBuilder = ({ target }) => {
  const [copied, setCopied] = useState(false);
  
  if (!target) return null;

  const categories = {
    "Exposed Files": [
      `site:${target}`,
      `filetype:pdf site:${target}`,
      `filetype:xls site:${target}`,
      `filetype:doc site:${target}`,
      `"${target}" filetype:sql`
    ],
    "Login Pages": [
      `inurl:login site:${target}`,
      `inurl:admin site:${target}`
    ],
    "Config/Git": [
      `inurl:config site:${target}`,
      `inurl:.git site:${target}`
    ],
    "Sensitive Dirs": [
      `intitle:"index of" site:${target}`,
      `intext:"password" site:${target}`,
      `intext:"@${target}"`
    ],
    "Cached/Related": [
      `cache:${target}`,
      `related:${target}`,
      `link:${target}`
    ]
  };

  const allDorks = Object.values(categories).flat();

  const handleCopyAll = () => {
    navigator.clipboard.writeText(allDorks.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-xl border border-gray-700 shadow-xl w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Google Dork Builder
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Target: <span className="text-green-400 font-mono font-medium">{target}</span>
          </p>
        </div>
        <button
          onClick={handleCopyAll}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 border border-blue-500 shadow-md"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copy All Dorks
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(categories).map(([category, dorkList]) => (
          <div key={category} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-inner flex flex-col h-full">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-gray-700">
              {category}
            </h3>
            <div className="flex flex-col gap-2 flex-grow">
              {dorkList.map((dork, i) => (
                <a
                  key={i}
                  href={`https://google.com/search?q=${encodeURIComponent(dork)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gray-900 border border-gray-600 hover:border-blue-500 hover:bg-gray-750 hover:text-blue-300 rounded text-xs font-mono text-gray-300 transition-all flex items-center justify-between group leading-relaxed break-all"
                  title="Search in Google"
                >
                  <span className="mr-2">{dork}</span>
                  <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 flex-shrink-0 text-blue-400 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DorkBuilder;
