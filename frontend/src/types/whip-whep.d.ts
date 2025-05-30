declare module "whip-whep/whip.js" {
  export class WHIPClient {
    constructor();
    
    // Properties that can be overridden
    onOffer: (offer: string) => string;
    onAnswer: (answer: string) => string;
    
    // Methods
    publish(pc: RTCPeerConnection, url: string, token?: string): Promise<void>;
    restart(): void;
    patch(): Promise<void>;
    mute(muted: any): Promise<void>;
    stop(): Promise<void>;
    
    // Internal properties (read-only)
    readonly pc?: RTCPeerConnection;
    readonly token?: string;
    readonly resourceURL?: URL;
    readonly etag?: string;
    readonly iceUsername?: string;
    readonly icePassword?: string;
    readonly candidates: RTCIceCandidate[];
    readonly endOfcandidates: boolean;
  }
}
