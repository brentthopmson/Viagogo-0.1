import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

interface RawResult {
  title: string;
  snippet: string;
  url: string;
  imageUrl?: string;
}

function parseResultLi(html: string, startPos: number): { result: RawResult | null; nextPos: number } {
  const liStart = html.lastIndexOf('<li', startPos);
  if (liStart === -1) return { result: null, nextPos: startPos + 1 };

  const liEnd = html.indexOf('</li>', startPos);
  if (liEnd === -1) return { result: null, nextPos: startPos + 1 };

  const liContent = html.slice(liStart, liEnd + 5);

  const h2Match = liContent.match(/<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/i);
  if (!h2Match) return { result: null, nextPos: liEnd + 5 };

  const rawTitle = h2Match[2].replace(/<[^>]+>/g, '').trim();
  if (!rawTitle) return { result: null, nextPos: liEnd + 5 };

  let url = h2Match[1];
  const uParam = url.match(/[?&]u=([^&]+)/);
  if (uParam) {
    try { url = Buffer.from(uParam[1].replace(/^a1a/, ''), 'base64').toString('utf-8'); } catch {}
  }
  const citeMatch = liContent.match(/<cite>(.*?)<\/cite>/i);
  if (citeMatch) {
    url = citeMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  const capMatch = liContent.match(/<div[^>]*class="b_caption"[^>]*>.*?<p[^>]*>(.*?)<\/p>/i);
  const snippet = capMatch ? capMatch[1].replace(/<[^>]+>/g, ' ').trim().slice(0, 300) : '';

  return { result: { title: rawTitle, url, snippet }, nextPos: liEnd + 5 };
}

function extractBingResults(html: string): RawResult[] {
  const results: RawResult[] = [];
  let searchPos = 0;

  for (let i = 0; i < 10; i++) {
    const algoStart = html.indexOf('b_algo', searchPos);
    if (algoStart === -1) break;

    const { result, nextPos } = parseResultLi(html, algoStart);
    if (result) results.push(result);
    searchPos = nextPos;

    if (results.length >= 3) break;
  }

  return results;
}

function extractOGImage(html: string): string | null {
  const og = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i.exec(html);
  if (og) return og[1];
  const img = /<img[^>]*src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i.exec(html);
  if (img) return img[1];
  return null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=en`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) }
    );

    const html = await res.text();
    const results = extractBingResults(html);
    const fallbackImage = extractOGImage(html) ||
      `https://image.pollinations.ai/prompt/${encodeURIComponent(q + ' event concert ticket poster')}`;

    const merged = results.map((r, i) => ({
      ...r,
      imageUrl: i === 0 ? fallbackImage : '',
    }));

    return NextResponse.json({ results: merged });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch search results', results: [] }, { status: 500 });
  }
}
