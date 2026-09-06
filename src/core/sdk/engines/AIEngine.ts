export class AIEngine {
  static async generateEmbedding(text: string): Promise<number[]> {
    return [];
  }
  static async match(
    input: any,
    candidates: any[],
    fields: string[],
  ): Promise<any[]> {
    return candidates;
  }
}
