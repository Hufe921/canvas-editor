declare module 'bidi-js' {
  interface EmbeddingResult {
    levels: Uint8Array | number[]
    paragraphs: Array<{ start: number; end: number; level: number }>
  }

  interface BidiApi {
    getBidiCharTypeName(char: string): string
    getEmbeddingLevels(
      text: string,
      direction?: 'ltr' | 'rtl' | 'auto' | number
    ): EmbeddingResult
    getReorderedIndices(text: string, embedding: EmbeddingResult): number[]
    getReorderSegments(
      text: string,
      embedding: EmbeddingResult
    ): Array<[number, number]>
    getReorderedString(text: string, embedding: EmbeddingResult): string
  }

  function bidiFactory(): BidiApi
  export default bidiFactory
}
