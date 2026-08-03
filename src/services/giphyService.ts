export interface GiphySelection {
  id: string;
  title: string;
  altText: string;
  username?: string;
  displayName?: string;
  giphyUrl: string;
  profileUrl?: string;
  sourceTld?: string;
  sourcePostUrl?: string;
  imageUrl: string;
  width: number;
  height: number;
  analytics: { onload?: string; onclick?: string; onsent?: string };
}

const API_ROOT = 'https://api.giphy.com/v1/gifs';
const apiKey = import.meta.env.VITE_GIPHY_API_KEY?.trim();
const customerId = crypto.randomUUID();

const analyticsUrl = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === 'string' ? url : undefined;
  }
  return undefined;
};

const normalize = (raw: any): GiphySelection => ({
  id: raw.id,
  title: raw.title || 'GIF',
  altText: raw.alt_text || raw.title || 'GIF',
  username: raw.username || undefined,
  displayName: raw.user?.display_name || undefined,
  giphyUrl: raw.url,
  profileUrl: raw.user?.profile_url || undefined,
  sourceTld: raw.source_tld || undefined,
  sourcePostUrl: raw.source_post_url || undefined,
  imageUrl: raw.images?.fixed_width?.url || raw.images?.original?.url,
  width: Number(raw.images?.fixed_width?.width || raw.images?.original?.width || 240),
  height: Number(raw.images?.fixed_width?.height || raw.images?.original?.height || 180),
  analytics: {
    onload: analyticsUrl(raw.analytics?.onload),
    onclick: analyticsUrl(raw.analytics?.onclick),
    onsent: analyticsUrl(raw.analytics?.onsent),
  },
});

async function request(path: string, params: Record<string, string>) {
  if (!apiKey) throw new Error('GIPHY is not configured');
  const query = new URLSearchParams({ api_key: apiKey, customer_id: customerId, rating: 'g', bundle: 'messaging_non_clips', ...params });
  const response = await fetch(`${API_ROOT}${path}?${query}`);
  if (!response.ok) throw new Error(`GIPHY request failed (${response.status})`);
  return response.json();
}

export const giphyService = {
  isConfigured: Boolean(apiKey),
  async discover(query: string): Promise<GiphySelection[]> {
    const exactQuery = query.trim().slice(0, 50);
    const payload = await request(exactQuery ? '/search' : '/trending', exactQuery
      ? { q: exactQuery, limit: '30', lang: 'vi' }
      : { limit: '30' });
    return (payload.data || []).map(normalize);
  },
  async getById(id: string): Promise<GiphySelection> {
    const payload = await request(`/${encodeURIComponent(id)}`, {});
    return normalize(payload.data);
  },
  track(url?: string) {
    if (typeof url !== 'string' || !url) return;
    const target = new URL(url);
    target.searchParams.set('ts', Date.now().toString());
    target.searchParams.set('customer_id', customerId);
    void fetch(target, { mode: 'no-cors', keepalive: true });
  },
};

export const toGiphyMessageMetadata = (gif: GiphySelection) => ({
  gif: {
    provider: 'GIPHY', id: gif.id, version: 1, title: gif.title, altText: gif.altText,
    username: gif.username, displayName: gif.displayName, giphyUrl: gif.giphyUrl,
    profileUrl: gif.profileUrl, sourceTld: gif.sourceTld,
  },
});
