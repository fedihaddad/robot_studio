const DEFAULT_ROSBRIDGE_HOSTNAME = 'axel.local';
const DEFAULT_ROSBRIDGE_PORT = 9090;

export const DEFAULT_ROSBRIDGE_URL = `ws://${DEFAULT_ROSBRIDGE_HOSTNAME}:${DEFAULT_ROSBRIDGE_PORT}`;

const LEGACY_DEFAULT_URLS = new Set([
  'ws://10.151.21.13:9090',
  'ws://192.168.1.100:9090',
  'ws://localhost:9090',
]);

export function normalizeRosbridgeUrl(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return DEFAULT_ROSBRIDGE_URL;
  if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;

  const hostPort = raw.replace(/^https?:\/\//, '');
  const hasPort = /:\d+$/.test(hostPort);
  return hasPort ? `ws://${hostPort}` : `ws://${hostPort}:${DEFAULT_ROSBRIDGE_PORT}`;
}

export function isLegacyRosbridgeDefault(value?: string | null): boolean {
  const normalized = normalizeRosbridgeUrl(value);
  return LEGACY_DEFAULT_URLS.has(normalized);
}

export function getRosbridgeCandidates(configuredUrl?: string | null): string[] {
  const primary = DEFAULT_ROSBRIDGE_URL;
  const configured = normalizeRosbridgeUrl(configuredUrl);
  const candidates = [primary];

  if (configured && configured !== primary) {
    candidates.push(configured);
  }

  return Array.from(new Set(candidates));
}

export function getRosbridgeConnectionSummary(configuredUrl?: string | null): {
  primary: string;
  fallback?: string;
  candidates: string[];
} {
  const candidates = getRosbridgeCandidates(configuredUrl);
  return {
    primary: candidates[0],
    fallback: candidates[1],
    candidates,
  };
}

export {
  DEFAULT_ROSBRIDGE_HOSTNAME,
  DEFAULT_ROSBRIDGE_PORT,
};
