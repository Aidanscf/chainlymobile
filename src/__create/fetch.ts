import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import {
  rewriteLocalhostHost,
  rewriteLocalhostUrl,
} from '@/services/apiBaseUrl';

const originalFetch = fetch;
const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;

const getURLFromArgs = (...args: Parameters<typeof fetch>) => {
  const [urlArg] = args;
  let url: string | null;
  if (typeof urlArg === 'string') {
    url = urlArg;
  } else if (typeof urlArg === 'object' && urlArg !== null) {
    url = urlArg.url;
  } else {
    url = null;
  }
  return url;
};

const isFileURL = (url: string) => {
  return url.startsWith('file://') || url.startsWith('data:');
};

const isApiPath = (path: string) => {
  return path.startsWith('/api/') || path.startsWith('/_create/');
};

function parseUrl(url: string) {
  try {
    if (url.startsWith('/')) {
      return { host: '', hostname: '', pathname: url.split('?')[0], pathWithQuery: url };
    }
    const parsed = new URL(url);
    return {
      host: parsed.host,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      pathWithQuery: `${parsed.pathname}${parsed.search}`,
    };
  } catch {
    return null;
  }
}

function currentPageHost() {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.host;
}

function isLoopbackHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isApiBackendHost(host: string, hostname: string) {
  if (!host) return false;
  if (host === currentPageHost()) return false;

  const apiHosts = new Set(['chainly.club', 'www.chainly.club']);
  for (const raw of [
    process.env.EXPO_PUBLIC_PROXY_BASE_URL,
    process.env.EXPO_PUBLIC_BASE_URL,
  ]) {
    if (!raw) continue;
    try {
      apiHosts.add(new URL(raw).host);
    } catch {
      // ignore
    }
  }
  if (process.env.EXPO_PUBLIC_HOST) {
    apiHosts.add(String(process.env.EXPO_PUBLIC_HOST).split('/')[0]);
  }

  if (apiHosts.has(host)) return true;
  // Backend on :8000 vs Expo on :8081 — both look like localhost.
  if (isLoopbackHostname(hostname) && host !== currentPageHost()) return true;
  return false;
}

/**
 * Expo Router prefixes app routes with EXPO_PUBLIC_BASE_URL / PROXY.
 * Those must stay SPA routes, not FastAPI 404 JSON pages.
 */
function localAppPathFromUrl(url: string) {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  if (isApiPath(parsed.pathname)) return null;

  if (url.startsWith('/')) {
    return parsed.pathWithQuery;
  }

  if (isApiBackendHost(parsed.host, parsed.hostname)) {
    return parsed.pathWithQuery.startsWith('/')
      ? parsed.pathWithQuery
      : `/${parsed.pathWithQuery}`;
  }

  return null;
}

function apiRoot() {
  return (
    process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    ''
  );
}

const isFirstPartyURL = (url: string) => {
  if (localAppPathFromUrl(url)) return false;
  const root = rewriteLocalhostUrl(apiRoot());
  return (
    isApiPath(url) ||
    (!!root && url.startsWith(`${root}/api/`)) ||
    (!!root && url.startsWith(`${root}/_create/`))
  );
};

const isSecondPartyURL = (url: string) => {
  return url.startsWith('/_create/');
};

type Params = Parameters<typeof expoFetch>;
const fetchToWeb = async function fetchWithHeaders(...args: Params) {
  const [input, init] = args;
  const url = getURLFromArgs(input, init);
  if (!url) {
    return originalFetch(input, init);
  }

  if (isFileURL(url)) {
    return originalFetch(input, init);
  }

  const localAppPath = localAppPathFromUrl(url);
  if (localAppPath) {
    return originalFetch(localAppPath, init);
  }

  const rewrittenUrl = rewriteLocalhostUrl(url);
  if (rewrittenUrl !== url && typeof input === 'string') {
    return fetchToWeb(rewrittenUrl, init);
  }

  if (!isFirstPartyURL(url)) {
    return originalFetch(input, init);
  }

  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const firstPartyURL = process.env.EXPO_PUBLIC_BASE_URL;
  const rawBaseURL =
    isSecondPartyURL(url) && proxyURL
      ? proxyURL
      : proxyURL || firstPartyURL;
  const baseURL = rewriteLocalhostUrl(rawBaseURL || '');

  if (!baseURL && isApiPath(url)) {
    console.warn(`[fetch] No base URL found for internal request: ${url}`);
  }

  let finalInput = input;
  if (typeof input === 'string') {
    finalInput = input.startsWith('/') ? `${baseURL || ''}${input}` : input;
  } else {
    return originalFetch(input, init);
  }

  const initHeaders = init?.headers ?? {};
  const finalHeaders = new Headers(initHeaders);

  const headers: Record<string, string | undefined> = {
    'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
    'ngrok-skip-browser-warning': 'true',
  };

  if (Platform.OS !== 'web') {
    const apiHost = rewriteLocalhostHost(process.env.EXPO_PUBLIC_HOST);
    headers.host = apiHost;
    headers['x-forwarded-host'] = apiHost;
    headers['x-createxyz-host'] = apiHost;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      finalHeaders.set(key, value);
    }
  }

  const auth = await SecureStore.getItemAsync(authKey)
    .then((stored) => {
      return stored ? JSON.parse(stored) : null;
    })
    .catch(() => {
      return null;
    });

  if (auth && !finalHeaders.has('authorization')) {
    finalHeaders.set('authorization', `Bearer ${auth.jwt}`);
  }

  return expoFetch(finalInput, {
    ...init,
    headers: finalHeaders,
  });
};

export default fetchToWeb;
