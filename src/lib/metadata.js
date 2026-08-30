const ENDPOINT = 'https://api.microlink.io/'
const RETRY_DELAY_MS = 300

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchMetadata(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${ENDPOINT}?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error(`microlink ${res.status}`)
      const json = await res.json()
      if (json?.status !== 'success') throw new Error('microlink failed')
      return {
        title: json.data?.title || '',
        description: json.data?.description || '',
        image: json.data?.image?.url || '',
      }
    } catch (error) {
      if (attempt === 0) await wait(RETRY_DELAY_MS)
    }
  }
  return null
}
