import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { giphyService, type GiphySelection } from '../../services/giphyService';

export const GiphyGifPicker: React.FC<{ onSelect: (gif: GiphySelection) => void }> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GiphySelection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      giphyService.discover(query).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  return <div className="flex h-64 flex-col gap-2">
    <label className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 dark:bg-zinc-900">
      <Search className="h-4 w-4 text-gray-400" />
      <input value={query} maxLength={50} onChange={e => setQuery(e.target.value)} placeholder="Tìm GIF trên GIPHY"
        className="h-9 flex-1 bg-transparent text-sm outline-none dark:text-white" />
    </label>
    <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-x-hidden overflow-y-auto custom-scrollbar">
      {loading ? <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-gray-400" /> : items.map(gif =>
        <button key={gif.id} type="button" className="relative aspect-square min-w-0 overflow-hidden rounded-lg" onClick={() => { giphyService.track(gif.analytics.onclick); onSelect(gif); }}>
          <img src={gif.imageUrl} alt={gif.altText} className="h-full w-full object-cover" loading="lazy" onLoad={() => giphyService.track(gif.analytics.onload)} />
          {(gif.username || gif.displayName || gif.sourceTld) && <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-slate-950/75 px-1.5 py-0.5 text-left text-[9px] font-semibold text-white">{gif.username ? `@${gif.username}` : (gif.displayName || gif.sourceTld)}</span>}
        </button>)}
    </div>
    <div className="flex h-8 items-center justify-center border-t border-gray-100 dark:border-zinc-800">
      <span className="inline-flex h-6 items-center rounded-full bg-slate-900 px-2.5">
        <img src="/brands/powered-by-giphy.png" alt="Powered by GIPHY" className="h-4 w-auto" />
      </span>
    </div>
  </div>;
};
