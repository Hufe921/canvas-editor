declare module 'jspdf' {
  export interface Context2d {
    setLineDash(dashArray: number[]): void;
  }
}
