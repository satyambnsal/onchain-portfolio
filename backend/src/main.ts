import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { Alchemy, Network } from 'alchemy-sdk'
import z from 'zod'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { TOKENS } from './constants'

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || ''
const config = {
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}

const alchemy = new Alchemy(config)
const server: FastifyInstance = Fastify({ logger: true })
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)
server.register(cors)

/* For simplicity, I'm going for in-memory cache. In production we can use redis but I decided to 
not implement it here as it adds additional overhead for person trying the app locally 
*/
const cache = new Map()

const schema = {
  $id: 'get-balance',
  querystring: z.object({
    address: z.string().regex(new RegExp(/^(0x)?[0-9a-fA-F]{40}$/), 'Invalid Ethereum Address'),
  }),
  response: {
    200: z.object({
      tokens: z.array(
        z.object({
          symbol: z.string(),
          balance: z.string(),
        })
      ),
      success: z.boolean(),
    }),
    '4xx': z.object({
      message: z.string(),
    }),
  },
}

server.route({
  method: 'GET',
  url: '/api/status',
  handler: (req, res) => {
    res.send({ status: 'API server up and running' })
  },
})

server.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/api/balance',
  schema,
  handler: async (req, res) => {
    console.log(req.query.address)
    const address = req.query.address
    if (cache.has(address)) {
      const cachedEntry = cache.get(address)
      const ageInSeconds = (Date.now() - cachedEntry.timestamp) / 1000
      if (ageInSeconds < 60) {
        console.log('returning from cache')
        return cachedEntry.data
      }
    }
    const [linkUsdcBalanceRaw, ethBalanceRaw] = await Promise.all([
      alchemy.core.getTokenBalances(address, [
        TOKENS.USDC.contractAddress,
        TOKENS.LINK.contractAddress,
      ]),
      alchemy.core.getBalance(address),
    ])
    const linkUsdcBalances = linkUsdcBalanceRaw.tokenBalances.map((tokenBalance) => {
      const balanceFormatted = formatHexBalance(tokenBalance.tokenBalance)
      const symbol =
        Object.values(TOKENS).find(
          ({ contractAddress }) => contractAddress === tokenBalance.contractAddress
        )?.symbol || ''
      return { symbol, balance: balanceFormatted }
    })

    const ethBalance = formatHexBalance(ethBalanceRaw._hex)
    const response = {
      tokens: [{ symbol: 'ETH', balance: ethBalance }, ...linkUsdcBalances],
      success: true,
    }

    cache.set(address, { data: response, timestamp: Date.now() })
    return response
  },
})

const start = async () => {
  try {
    await server.listen({ port: 3001 })
    const address = server.server.address()
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

function formatHexBalance(hexValue, decimals = 18) {
  // Convert hex to BigInt
  const value = BigInt(hexValue)

  // Convert to decimal value (divide by 10^decimals)
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  // Convert to string with appropriate decimal places
  let result = integerPart.toString()

  // Add comma separators to integer part
  result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Handle the fractional part
  if (fractionalPart > 0) {
    // Convert to string and pad with leading zeros if needed
    let fractionStr = fractionalPart.toString().padStart(decimals, '0')

    // Trim trailing zeros
    fractionStr = fractionStr.replace(/0+$/g, '')

    // Limit to 4 significant digits for fractional part
    if (fractionStr.length > 4) {
      // Find first non-zero digit
      const firstNonZero = fractionStr.search(/[1-9]/)

      // Keep at most 4 significant digits after first non-zero
      const keepDigits = Math.min(firstNonZero + 4, fractionStr.length)
      fractionStr = fractionStr.substring(0, keepDigits)
    }

    if (fractionStr.length > 0) {
      result += '.' + fractionStr
    }
  }

  return result
}
