declare module "@banuba/webar" {
  export class Player {
    static create(config: any): Promise<Player>;
    addModule(module: any): Promise<void>;
    use(canvas: HTMLCanvasElement): void;
    play(): Promise<void>;
    destroy(): void;
  }
  export class Effect {
    static preload(url: string): Promise<Effect>;
  }
  export class Module {
    static preload(url: string): Promise<Module>;
  }
}

declare module "@mediapipe/tasks-vision" {
  export class FaceLandmarker {
    static createFromOptions(vision: any, options: any): Promise<FaceLandmarker>;
    detectForVideo(video: HTMLVideoElement, timestamp: number): any;
    close(): void;
  }
  export class FilesetResolver {
    static forVisionTasks(url: string): Promise<any>;
  }
  export const FaceLandmarkerResult: any;
}
