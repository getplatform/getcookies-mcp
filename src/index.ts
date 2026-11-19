#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { TOOLS, errorMessage, planRequest, type JsonObject } from './tools.js'

const VERSION = '1.1.0'
const TOKEN = process.env.GETCOOKIE_API_KEY || process.env.GETCOOKIE_ACCESS_TOKEN
const API_URL = (process.env.GETCOOKIE_API_URL || 'https://api.getcookies.co').replace(/\/+$/, '')
const REQUEST_TIMEOUT_MS = 120_000

if (!TOKEN) {
  console.error(
    'GETCOOKIE_API_KEY is required. Create a personal access token at https://getcookies.co/connect-claude'
  )
  process.exit(1)
}
if (TOKEN.startsWith('olc_')) {
  console.error(
    'GETCOOKIE_API_KEY is an enterprise API key (olc_). The MCP server needs a personal access token (gcpat_) from https://getcookies.co/connect-claude'
  )
}

async function call(name: string, args: JsonObject | undefined): Promise<unknown> {
  const plan = planRequest(name, args)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': `getcookie-mcp/${VERSION}`,
  }
  if (plan.body) headers['Content-Type'] = 'application/json'
  if (plan.authenticated) headers.Authorization = `Bearer ${TOKEN}`

  const response = await fetch(`${API_URL}${plan.path}`, {
    method: plan.method,
    headers,
    body: plan.body ? JSON.stringify(plan.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const text = await response.text()
  let data: unknown = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!response.ok) throw new Error(errorMessage(response.status, response.statusText, data))
  return data
}

const server = new Server({ name: 'getcookie-mcp', version: VERSION }, { capabilities: { tools: {} } })

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    const result = await call(name, args as JsonObject | undefined)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
  }
})

async function main() {
  await server.connect(new StdioServerTransport())
  console.error(`getcookie-mcp ${VERSION} connected to ${API_URL}`)
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
