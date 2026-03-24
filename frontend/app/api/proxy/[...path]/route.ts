import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const path = pathSegments.join('/').replace(/\/$/, '');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set('ngrok-skip-browser-warning', '1');

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: 'follow',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = await req.arrayBuffer();
  }

  const response = await fetch(targetUrl, fetchOptions);
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
