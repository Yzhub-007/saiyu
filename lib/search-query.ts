export function readSearchQuery(params: { q?: string | string[]; page?: string | string[] }) {
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const page = Array.isArray(params.page) ? params.page[0] : params.page;
  const query = (raw ?? "").trim().slice(0, 120);
  const number = Number(page);
  return { query, normalized: query.toLocaleLowerCase("zh-CN"), requestedPage: Number.isSafeInteger(number) && number > 0 ? number : 1 };
}

export function searchPageWindow(counts: number[], limits: number[], requestedPage: number) {
  const pages = Math.max(1, ...counts.map((count, index) => Math.ceil(count / limits[index])));
  const page = Math.min(Math.max(1, requestedPage), pages);
  return { page, pages, offsets: limits.map((limit) => (page - 1) * limit) };
}
