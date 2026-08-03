import React, { useEffect, useState } from 'react';
import { giphyService, type GiphySelection } from '../../services/giphyService';

export const GiphyGifMessage: React.FC<{ id: string; alt?: string }> = ({ id, alt }) => {
  const [gif, setGif] = useState<GiphySelection | null>(null);
  useEffect(() => {
    let active = true;
    if (giphyService.isConfigured) giphyService.getById(id).then(value => active && setGif(value)).catch(() => undefined);
    return () => { active = false; };
  }, [id]);
  if (!giphyService.isConfigured) return <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-500">GIF không khả dụng.</div>;
  if (!gif) return <div className="h-40 w-56 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-700" />;
  const attribution = gif.username ? `@${gif.username}` : (gif.displayName || gif.sourceTld || '');
  return <div className="relative max-w-[280px] overflow-hidden rounded-xl">
    <img src={gif.imageUrl} alt={alt || gif.altText} className="block h-auto w-full" onLoad={() => giphyService.track(gif.analytics.onload)} />
    {attribution && <span className="absolute bottom-2 left-2 max-w-[75%] truncate rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">{attribution}</span>}
  </div>;
};
