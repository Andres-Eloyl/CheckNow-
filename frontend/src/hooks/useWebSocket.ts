import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AI Context: Options for initializing the WebSocket hook.
 */
interface WebSocketHookOptions {
  /** The WebSocket server URL (ws:// or wss://). */
  url: string;
  /** Callback executed when a message is received. */
  onMessage?: (e: MessageEvent) => void;
  /** Callback executed when connection is established. */
  onConnect?: () => void;
  /** Callback executed when connection is lost. */
  onDisconnect?: () => void;
}

/**
 * AI Context: A custom hook to manage WebSocket connections with auto-reconnect.
 * This is primarily intended for real-time updates (e.g., Kitchen/Bar Display changes).
 *
 * @param options WebSocketHookOptions
 * @returns { isConnected, lastMessage, sendMessage }
 */
export function useWebSocket({ url, onMessage, onConnect, onDisconnect }: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  /** AI Context: Connect logic wrapped in useCallback to avoid constant recreations. Includes auto-reconnect on close/error. */
  const connect = useCallback(() => {
    // Prevent connecting if SSR, already connecting/open, or if URL is empty
    if (typeof window === 'undefined' || !url || ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        onConnectRef.current?.();
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        onDisconnectRef.current?.();
        // Automatically try to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.warn('WebSocket Exception:', error);
        ws.current?.close();
      };

      ws.current.onmessage = (e) => {
        setLastMessage(e);
        onMessageRef.current?.(e);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket', error);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [url]);

  // Establish connection on mount and clean up on unmount.
  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  /** Function to push data through the open WebSocket safely. */
  const sendMessage = useCallback((data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message.');
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
