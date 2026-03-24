import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 15000;
const FETCH_RETRIES = 2;

function buildProxyHeaders(req: NextRequest): Headers {
  const headers = new Headers();

  const passThroughHeaders = [
    'accept',
    'authorization',
    'content-type',
    'x-api-key',
    'x-request-id',
    'x-requested-with',
  ];

  for (const headerName of passThroughHeaders) {
    const value = req.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  headers.set('ngrok-skip-browser-warning', '1');

  return headers;
}

async function fetchWithRetry(targetUrl: string, options: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt < FETCH_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const path = pathSegments.join('/').replace(/\/$/, '');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path}${search}`;

  const headers = buildProxyHeaders(req);

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: 'follow',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.arrayBuffer();
  }

  let response: Response;
  try {
    response = await fetchWithRetry(targetUrl, fetchOptions);
  } catch (err) {
    const cause = (err as any)?.cause;
    const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : undefined;
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(JSON.stringify({
      error: 'Proxy fetch failed',
      detail: message,
      cause: causeMsg,
      target: targetUrl,
    }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  const responseBody = await response.arrayBuffer();

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
