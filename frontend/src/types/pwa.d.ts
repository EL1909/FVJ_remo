// El evento beforeinstallprompt (Chrome/Edge/Android) no está en el lib.dom.d.ts
// estándar de TypeScript — Safari/iOS nunca lo dispara, no tiene esta API.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
