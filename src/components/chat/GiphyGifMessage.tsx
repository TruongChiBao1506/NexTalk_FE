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
  return <div className="max-w-[280px] overflow-hidden rounded-xl">
    <img src={gif.imageUrl} alt={alt || gif.altText} className="block h-auto w-full" onLoad={() => giphyService.track(gif.analytics.onload)} />
    <div className="flex justify-end bg-white px-2 py-1"><img src="/brands/powered-by-giphy.png" alt="Powered by GIPHY" className="h-4 w-auto" /></div>
  </div>;
};
