import React from 'react';
import { Server, Cpu, Globe } from 'lucide-react';

export default function TechStackWidget({ technologies, domain, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <span></span> Technology Footprint
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="skeleton" style={{ height: '56px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '56px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '56px', borderRadius: '4px' }}></div>
          <div className="skeleton" style={{ height: '56px', borderRadius: '4px' }}></div>
        </div>
      </div>
    );
  }

  if (!technologies || technologies.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Technology Footprint</h3>
        <p className="text-gray-500 text-xs italic">No technology stack signatures identified for {domain}.</p>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'server':
        return <Server className="text-emerald-400 w-4 h-4" />;
      case 'web engine':
      case 'framework':
        return <Cpu className="text-cyan-400 w-4 h-4" />;
      default:
        return <Globe className="text-indigo-400 w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span></span> Technology Footprint
        </h3>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
          Passive Discovery
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {technologies.map((tech, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-950 border border-gray-800 rounded hover:border-emerald-600/50 transition-all duration-200">
            <div className="p-2 bg-gray-900 border border-gray-850 rounded">
              {getIcon(tech.type)}
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{tech.type}</div>
              <div className="text-xs text-white font-mono mt-0.5">{tech.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
