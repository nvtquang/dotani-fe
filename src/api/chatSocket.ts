import type { Client, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { env } from './config';
import { tokenStorage } from './tokenStorage';

/*
 * One STOMP connection for the whole app. Components subscribe to topics through useTopic();
 * several listeners on the same topic share one STOMP subscription, and every topic is
 * re-subscribed automatically after a reconnect.
 */

type Listener = (body: unknown) => void;
type TopicEntry = { listeners: Set<Listener>; subscription: StompSubscription | null };

const topics = new Map<string, TopicEntry>();
const statusListeners = new Set<() => void>();
let client: Client | null = null;
let loading = false;
let connected = false;

const setConnected = (value: boolean) => {
  if (connected !== value) {
    connected = value;
    statusListeners.forEach((listener) => listener());
  }
};

const stompSubscribe = (topic: string, entry: TopicEntry) => {
  if (!client?.connected) {
    return;
  }
  entry.subscription = client.subscribe(topic, (message) => {
    let body: unknown = message.body;
    try {
      body = JSON.parse(message.body);
    } catch {
      // plain text frame
    }
    entry.listeners.forEach((listener) => listener(body));
  });
};

// The STOMP library is loaded on first use, so pages that never touch chat do not download it.
const ensureClient = () => {
  if (client || loading || !tokenStorage.getAccessToken()) {
    return;
  }
  loading = true;
  void import('@stomp/stompjs')
    .then(({ Client: StompClient }) => {
      if (!tokenStorage.getAccessToken()) {
        return;
      }
      client = new StompClient({
        brokerURL: env.chatWsUrl,
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => undefined,
        // read the token on every (re)connect: it may have been refreshed meanwhile
        beforeConnect: (stomp) => {
          const token = tokenStorage.getAccessToken();
          stomp.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        },
        onConnect: () => {
          setConnected(true);
          topics.forEach((entry, topic) => stompSubscribe(topic, entry));
        },
        onWebSocketClose: () => {
          setConnected(false);
          topics.forEach((entry) => {
            entry.subscription = null;
          });
        },
        onStompError: () => setConnected(false),
      });
      client.activate();
    })
    .finally(() => {
      loading = false;
    });
};

export const chatSocket = {
  subscribe(topic: string, listener: Listener) {
    ensureClient();
    let entry = topics.get(topic);
    if (!entry) {
      entry = { listeners: new Set(), subscription: null };
      topics.set(topic, entry);
      stompSubscribe(topic, entry);
    }
    entry.listeners.add(listener);

    return () => {
      const current = topics.get(topic);
      if (!current) {
        return;
      }
      current.listeners.delete(listener);
      if (current.listeners.size === 0) {
        current.subscription?.unsubscribe();
        topics.delete(topic);
      }
    };
  },

  publish(destination: string, body: unknown) {
    if (!client?.connected) {
      return false;
    }
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  },

  /** Closes the connection, e.g. on logout. */
  disconnect() {
    const current = client;
    client = null;
    topics.clear();
    setConnected(false);
    void current?.deactivate();
  },

  isConnected: () => connected,
};

const subscribeStatus = (listener: () => void) => {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
};

export const useChatConnected = () => {
  useEffect(() => ensureClient(), []);
  return useSyncExternalStore(subscribeStatus, chatSocket.isConnected);
};

/** Subscribes while mounted; the handler may change between renders without resubscribing. */
export const useTopic = <T,>(topic: string | null, handler: (body: T) => void) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!topic) {
      return;
    }
    return chatSocket.subscribe(topic, (body) => handlerRef.current(body as T));
  }, [topic]);
};
