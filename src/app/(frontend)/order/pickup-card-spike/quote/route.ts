import { checkoutResponse, currentQuote, readCheckoutBody } from '@/lib/pickup-card/checkout'

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const { quote } = await currentQuote(config, body.lines)
    return quote
  })
}
