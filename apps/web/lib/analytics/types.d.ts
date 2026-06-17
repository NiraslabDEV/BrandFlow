// Tipos globais para tracking (GTM, Pixel, GA4, Ads)
// Essas APIs são injetadas por scripts externos

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (
      event: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID: string }
    ) => void;
    _fbq?: {
      push: (args: unknown[]) => void;
    };
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

export {};