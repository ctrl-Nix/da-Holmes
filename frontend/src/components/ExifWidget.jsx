import React, { useState } from 'react';
import { Camera, Image, Info, AlertTriangle, FileUp } from 'lucide-react';

const ExifWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/forensics/exif', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        setError(result.detail || 'Analysis failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
        <div className="w-8 h-8 flex items-center justify-center border-2 border-black bg-cyan-500">
          <Camera size={16} color="#fff" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">Image Forensics</h3>
      </div>

      <div className="relative group">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="image/*"
        />
        <div className="border-4 border-dashed border-slate-200 p-6 flex flex-col items-center gap-2 group-hover:border-indigo-500 transition-colors">
          {loading ? (
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FileUp size={24} className="text-slate-300 group-hover:text-indigo-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600">
                Upload Target Media
              </span>
            </>
          )}
        </div>
      </div>

      {error && <div className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2"><AlertTriangle size={12}/> {error}</div>}

      {data && (
        <div className="flex flex-col gap-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Camera', val: data.Make + ' ' + data.Model },
              { label: 'Software', val: data.Software },
              { label: 'Date', val: data.DateTime },
              { label: 'Location', val: data.GPSPosition ? 'GPS EXTRACTED' : 'NONE'}
            ].map(item => (
              <div key={item.label} className="border-2 border-black p-2 bg-slate-50">
                <span className="block text-[8px] font-black uppercase text-slate-400 leading-none mb-1">{item.label}</span>
                <span className="block text-[10px] font-black text-indigo-700 truncate">{item.val || 'N/A'}</span>
              </div>
            ))}
          </div>
          {data.GPSPosition && (
            <div className="p-3 border-2 border-black bg-green-50 text-[10px] font-black text-green-700 uppercase flex items-center gap-2">
               <Info size={14} /> Critical Geodata Found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExifWidget;
