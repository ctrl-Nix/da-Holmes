import { Search } from 'lucide-react';

/**
 * da H<Search/>lmes brand logo
 * The 'o' in Holmes is replaced with the Search icon (amber-tinted).
 */
export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none border-4 border-black bg-yellow-400 px-3 py-1 shadow-[4px_4px_0px_#000]">
      <span className="flex items-center font-black text-2xl tracking-tighter uppercase italic">
        <span className="text-black">DA H</span>
        <Search
          id="logo-search-icon"
          className="text-black inline-block mx-[1px]"
          size={22}
          strokeWidth={4}
        />
        <span className="text-black">LMES</span>
      </span>

      <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-black text-white text-[10px] font-black tracking-widest uppercase">
        OSINT
      </span>
    </div>
  );
}
