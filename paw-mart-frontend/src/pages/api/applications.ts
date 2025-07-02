import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL + '/api/applications';

  // Prepare headers, removing 'host' to avoid issues
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== 'host' && typeof value === 'string') {
      headers[key] = value;
    }
  }

  // Read the raw body for non-GET/HEAD requests
  let body: any = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  const result = await fetch(backendUrl, {
    method: req.method,
    headers,
    body,
  });

  // Forward status and response
  const contentType = result.headers.get('content-type');
  res.status(result.status);
  if (contentType && contentType.includes('application/json')) {
    const data = await result.json();
    res.json(data);
  } else {
    const text = await result.text();
    res.send(text);
  }
}