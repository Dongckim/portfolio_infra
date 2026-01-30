// YouTube IFrame API 타입 선언
export {};

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string | HTMLElement, options: any) => any;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}


