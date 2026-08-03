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
    <div className="flex-1 columns-3 gap-2 overflow-y-auto custom-scrollbar">
      {loading ? <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-gray-400" /> : items.map(gif =>
        <button key={gif.id} type="button" className="mb-2 block w-full overflow-hidden rounded-lg" onClick={() => { giphyService.track(gif.analytics.onclick); onSelect(gif); }}>
          <img src={gif.imageUrl} alt={gif.altText} className="h-auto w-full" loading="lazy" onLoad={() => giphyService.track(gif.analytics.onload)} />
        </button>)}
    </div>
    <img src="/brands/powered-by-giphy.png" alt="Powered by GIPHY" className="ml-auto h-5 w-auto" />
  </div>;
};
