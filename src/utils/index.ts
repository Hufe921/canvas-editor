export function queryParams(key: string): string | null {
  const query = window.location.search.substring(1)
  const vars = query.split("&")
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=")
    if (pair[0] == key) {
      return pair[1]
    }
  }
  return null
}