#!/usr/bin/env node
// End-to-end check of the published flow through the real MCP server (stdio):
// whoami -> create_domain -> initiate_scan -> get_scan_status -> get_scan_cookies
// -> update_widget_config -> get_widget_snippet.
// Usage: GETCOOKIE_API_KEY=gcpat_... [GETCOOKIE_API_URL=...] E2E_DOMAIN=example.com npm run e2e
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const domain = process.env.E2E_DOMAIN
if (!process.env.GETCOOKIE_API_KEY || !domain) {
  console.error('Set GETCOOKIE_API_KEY and E2E_DOMAIN')
  process.exit(2)
}

const client = new Client({ name: 'getcookies-mcp-e2e', version: '1.0.0' })
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [new URL('../dist/index.js', import.meta.url).pathname],
    env: { ...process.env },
  })
)

async function tool(name, args = {}) {
  const result = await client.callTool({ name, arguments: args })
  const text = result.content?.[0]?.text ?? ''
  if (result.isError) throw new Error(`${name} failed: ${text}`)
  console.log(`ok ${name}`)
  return JSON.parse(text)
}

try {
  const { tools } = await client.listTools()
  console.log(`tools: ${tools.map((t) => t.name).join(', ')}`)
  const me = await tool('whoami')
  console.log(`  account: ${me.email}`)

  const listed = await tool('list_domains', { search: domain })
  const existing = (listed.items ?? listed.domains ?? listed).find?.((d) => d.domain === domain)
  const created = existing ?? (await tool('create_domain', { domain }))
  console.log(`  domain_id: ${created.id}`)

  const scan = await tool('initiate_scan', { domain_id: created.id })
  const scanId = scan.scan_id ?? scan.id
  let status = scan.status
  for (let i = 0; i < 60 && !['completed', 'failed'].includes(status); i++) {
    await new Promise((r) => setTimeout(r, 5000))
    status = (await tool('get_scan_status', { scan_id: scanId })).status
    console.log(`  scan status: ${status}`)
  }
  const cookies = await tool('get_scan_cookies', { scan_id: scanId })
  const cookieList = cookies.items ?? cookies.cookies ?? cookies
  console.log(`  cookies: ${Array.isArray(cookieList) ? cookieList.length : JSON.stringify(cookies).slice(0, 120)}`)

  const widget = await tool('update_widget_config', {
    domain_id: created.id,
    position: 'bottom-right',
    google_consent_mode_enabled: true,
    consent_mode_type: 'advanced',
  })
  if (widget.position !== 'bottom-right') throw new Error('widget position was not saved')
  const snippet = await tool('get_widget_snippet', { domain_id: created.id })
  const code = snippet.snippet ?? snippet.html ?? JSON.stringify(snippet)
  if (!String(code).includes(created.id)) throw new Error('snippet does not reference the domain')
  console.log('  snippet ok')
  console.log('E2E PASSED')
} finally {
  await client.close()
}
