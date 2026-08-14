export type PlaceHit = {
  id: number
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
  label: string
}

type OpenMeteoResult = {
  id: number
  name: string
  country?: string
  admin1?: string
  latitude: number
  longitude: number
}

function labelOf(hit: OpenMeteoResult) {
  return [hit.name, hit.admin1, hit.country].filter(Boolean).filter((part, i, all) => all.indexOf(part) === i).join(", ")
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: OpenMeteoResult[] }
  return (data.results ?? []).map((hit) => ({
    id: hit.id,
    name: hit.name,
    country: hit.country ?? "",
    admin1: hit.admin1,
    latitude: hit.latitude,
    longitude: hit.longitude,
    label: labelOf(hit),
  }))
}
