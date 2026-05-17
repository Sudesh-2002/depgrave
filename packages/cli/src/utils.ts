export async function pLimit<T>(
  items    : T[],
  limit    : number,
  fn       : (item: T, index: number) => Promise<any>
): Promise<any[]> {
  const results: any[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i    = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);
  return results;
}