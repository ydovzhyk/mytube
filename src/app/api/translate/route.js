import translate from 'translate'

translate.key = process.env.TRANSLATE_API_KEY

export async function POST(req) {
  try {
    const { text, to } = await req.json()

    const str = Array.isArray(text) ? text.join('') : String(text ?? '')
    const lang = String(to ?? '').trim()

    if (!str.trim()) return Response.json({ result: '' })
    if (!lang) return Response.json({ result: str })

    const result = await translate(str, { to: lang })
    return Response.json({ result })
  } catch {
    return Response.json({ result: null, error: 'TRANSLATE_FAILED' }, { status: 500 })
  }
}
