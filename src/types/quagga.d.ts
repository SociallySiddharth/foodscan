declare module 'quagga' {
  interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface CodeResult {
    code: string;
    format: string;
  }

  interface Result {
    boxes: Box[];
    codeResult: CodeResult;
  }

  interface InputStream {
    name: string;
    type: string;
    target: HTMLElement;
    constraints: {
      width: { min: number };
      height: { min: number };
      facingMode: string;
      aspectRatio: { min: number; max: number };
    };
  }

  interface Decoder {
    readers: string[];
    debug: {
      drawBoundingBox: boolean;
      drawScanline: boolean;
      showFrequency: boolean;
      drawScanlinePosition: boolean;
    };
  }

  interface Config {
    inputStream: InputStream;
    decoder: Decoder;
  }

  function init(config: Config, callback: (err: Error | null) => void): void;
  function start(): void;
  function stop(): void;
  function onDetected(callback: (result: Result) => void): void;
  function onProcessed(callback: (result: Result) => void): void;
}
