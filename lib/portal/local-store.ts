import { buildEmptyPortalPayload } from "@/lib/portal/defaults";
import type { ClientRecord, PortalPayload } from "@/lib/types";

type LocalStore = {
  clients: ClientRecord[];
  payloads: Record<string, PortalPayload>;
};

const LOCAL_CLIENTS: ClientRecord[] = [
  { id: "client-stratx", name: "Strat X Advisory", slug: "strat-x-advisory" },
  { id: "client-harborpeak", name: "Harbor Peak Capital", slug: "harbor-peak-capital" },
];

declare global {
  var __portalLocalStore: LocalStore | undefined;
}

function createStore(): LocalStore {
  const payloads: Record<string, PortalPayload> = {};
  for (const client of LOCAL_CLIENTS) {
    payloads[client.id] = buildEmptyPortalPayload(client.name);
  }

  return {
    clients: LOCAL_CLIENTS,
    payloads,
  };
}

export function getLocalStore() {
  if (!globalThis.__portalLocalStore) {
    globalThis.__portalLocalStore = createStore();
  }
  return globalThis.__portalLocalStore;
}

export function getLocalClients() {
  return getLocalStore().clients;
}

export function getLocalClientById(clientId: string) {
  return getLocalStore().clients.find((client) => client.id === clientId) ?? null;
}

export function getLocalPortalPayload(clientId: string) {
  const store = getLocalStore();
  return store.payloads[clientId] ?? null;
}

export function upsertLocalPortalPayload(clientId: string, payload: PortalPayload) {
  const store = getLocalStore();
  store.payloads[clientId] = payload;
}
