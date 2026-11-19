export type JsonObject = Record<string, unknown>

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: { type: 'object'; properties: JsonObject; required?: string[] }
}

export interface PlannedRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  path: string
  body?: JsonObject
  authenticated: boolean
}

const id = (description: string) => ({ type: 'string', description })
const domainId = { domain_id: id('Domain ID (from list_domains or create_domain)') }

export const WIDGET_FIELDS: JsonObject = {
  position: {
    type: 'string',
    enum: ['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right', 'top-center', 'center', 'center-modal'],
  },
  layout: { type: 'string', enum: ['box', 'banner', 'bar'] },
  theme: { type: 'string', enum: ['light', 'dark', 'custom'] },
  primary_color: { type: 'string', description: 'Hex color, e.g. #1976d2' },
  banner_title: { type: 'string' },
  banner_description: { type: 'string' },
  accept_all_text: { type: 'string' },
  reject_all_text: { type: 'string' },
  customize_text: { type: 'string' },
  show_reject_button: { type: 'boolean', description: 'Show Reject all on the first layer (keep true in the EU)' },
  privacy_policy_url: { type: 'string' },
  cookie_policy_url: { type: 'string' },
  auto_block_scripts: { type: 'boolean' },
  regulation_mode: { type: 'string', enum: ['auto', 'gdpr', 'us_optout', 'notice_only'] },
  google_consent_mode_enabled: { type: 'boolean', description: 'Send Google Consent Mode v2 signals (all plans)' },
  consent_mode_type: {
    type: 'string',
    enum: ['advanced', 'basic'],
    description:
      'advanced (default): Google tags send cookieless pings before consent. basic: the loader holds Google tags back until the visitor consents.',
  },
  tracker_blocking: {
    type: 'string',
    enum: ['on', 'monitor', 'off'],
    description:
      'on: known trackers (Meta, TikTok, LinkedIn, Hotjar, ...) wait for consent. monitor: only list them in the browser console. off: leave them alone.',
  },
  google_analytics_id: { type: 'string', description: 'GA4 measurement ID, e.g. G-XXXXXXX' },
  google_tag_manager_id: { type: 'string', description: 'GTM container ID, e.g. GTM-XXXXXX' },
  iab_tcf_enabled: { type: 'boolean', description: 'Enable IAB TCF v2.2' },
  consent_duration_days: { type: 'number', description: '1-730' },
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'whoami',
    description: 'Show the GetCookies account this MCP server is connected to. Use it to check the token works.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_domains',
    description: 'List the domains (websites) in the GetCookies account',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 100)' },
        search: { type: 'string', description: 'Filter by domain name' },
      },
    },
  },
  {
    name: 'create_domain',
    description: 'Add a website to GetCookies. Returns its domain_id.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string', description: 'Domain name, e.g. example.com' } },
      required: ['domain'],
    },
  },
  {
    name: 'get_domain',
    description: 'Get one domain, including install state',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'initiate_scan',
    description: 'Start a cookie scan of a domain. Returns scan_id; poll get_scan_status until it is completed.',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'get_scan_status',
    description: 'Check the status of a cookie scan',
    inputSchema: { type: 'object', properties: { scan_id: id('Scan ID') }, required: ['scan_id'] },
  },
  {
    name: 'get_scan_cookies',
    description: 'List the cookies a scan found, with categories',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: id('Scan ID'),
        limit: { type: 'number', description: 'Max results (default 200, max 1000)' },
      },
      required: ['scan_id'],
    },
  },
  {
    name: 'classify_cookie',
    description: 'Set the category of a detected cookie',
    inputSchema: {
      type: 'object',
      properties: {
        cookie_id: id('Cookie ID (from get_scan_cookies)'),
        category: { type: 'string', enum: ['necessary', 'analytics', 'marketing', 'unknown'] },
        description: { type: 'string', description: 'What the cookie does' },
      },
      required: ['cookie_id', 'category'],
    },
  },
  {
    name: 'get_widget_config',
    description: 'Get the consent banner configuration of a domain',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'update_widget_config',
    description: 'Change the consent banner. Only the fields you pass are changed.',
    inputSchema: {
      type: 'object',
      properties: { ...domainId, ...WIDGET_FIELDS },
      required: ['domain_id'],
    },
  },
  {
    name: 'get_widget_snippet',
    description: 'Get the install code to put first in the <head> of every page',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'verify_install',
    description: 'Check that the banner script is installed on the live site',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'run_reject_test',
    description:
      'Free public test of any URL: loads the page, clicks the banner\'s Reject all and reports the trackers and cookies that still fire, next to what fires before consent. Takes 30-60 s; limited to 5 runs per hour.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Page to test, e.g. https://example.com' } },
      required: ['url'],
    },
  },
  {
    name: 'get_consent_stats',
    description: 'Consent statistics for a domain (accept/reject rates, totals)',
    inputSchema: { type: 'object', properties: domainId, required: ['domain_id'] },
  },
  {
    name: 'get_consent_logs',
    description: 'Consent records for a domain (audit trail)',
    inputSchema: {
      type: 'object',
      properties: { ...domainId, limit: { type: 'number', description: 'Max results (default 100)' } },
      required: ['domain_id'],
    },
  },
  {
    name: 'get_domain_analytics',
    description: 'Consent analytics for a domain over a period',
    inputSchema: {
      type: 'object',
      properties: {
        ...domainId,
        start_date: { type: 'string', description: 'YYYY-MM-DD (default: 30 days ago)' },
        end_date: { type: 'string', description: 'YYYY-MM-DD (default: today)' },
      },
      required: ['domain_id'],
    },
  },
]

export class ToolInputError extends Error {}

function requireString(args: JsonObject, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ToolInputError(`${key} is required`)
  }
  return value.trim()
}

function segment(args: JsonObject, key: string): string {
  return encodeURIComponent(requireString(args, key))
}

function query(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
  return Math.min(Math.max(n, 1), max)
}

export function planRequest(name: string, rawArgs: JsonObject | undefined): PlannedRequest {
  const args = rawArgs ?? {}
  const auth = (method: PlannedRequest['method'], path: string, body?: JsonObject): PlannedRequest => ({
    method,
    path,
    body,
    authenticated: true,
  })

  switch (name) {
    case 'whoami':
      return auth('GET', '/api/v1/auth/me')
    case 'list_domains':
      return auth('GET', `/api/v1/domains${query({ limit: clampLimit(args.limit, 100, 1000), search: args.search })}`)
    case 'create_domain':
      return auth('POST', '/api/v1/domains', { domain: requireString(args, 'domain') })
    case 'get_domain':
      return auth('GET', `/api/v1/domains/${segment(args, 'domain_id')}`)
    case 'initiate_scan':
      return auth('POST', `/api/v1/domains/${segment(args, 'domain_id')}/scans`)
    case 'get_scan_status':
      return auth('GET', `/api/v1/scans/${segment(args, 'scan_id')}`)
    case 'get_scan_cookies':
      return auth(
        'GET',
        `/api/v1/scans/${segment(args, 'scan_id')}/cookies${query({ limit: clampLimit(args.limit, 200, 1000) })}`
      )
    case 'classify_cookie': {
      const body: JsonObject = { category: args.category }
      if (typeof args.description === 'string') body.description = args.description
      return auth('PATCH', `/api/v1/cookies/${segment(args, 'cookie_id')}`, body)
    }
    case 'get_widget_config':
      return auth('GET', `/api/v1/domains/${segment(args, 'domain_id')}/widget`)
    case 'update_widget_config': {
      const domain = segment(args, 'domain_id')
      const body: JsonObject = {}
      for (const key of Object.keys(WIDGET_FIELDS)) {
        if (args[key] !== undefined) body[key] = args[key]
      }
      if (Object.keys(body).length === 0) {
        throw new ToolInputError(`Pass at least one setting to change: ${Object.keys(WIDGET_FIELDS).join(', ')}`)
      }
      return auth('POST', `/api/v1/domains/${domain}/widget`, body)
    }
    case 'get_widget_snippet':
      return auth('GET', `/api/v1/domains/${segment(args, 'domain_id')}/widget/snippet`)
    case 'verify_install':
      return auth('POST', `/api/v1/installation/verify-script/${segment(args, 'domain_id')}`)
    case 'run_reject_test':
      return {
        method: 'POST',
        path: '/api/v1/public/scan',
        body: { url: requireString(args, 'url') },
        authenticated: false,
      }
    case 'get_consent_stats':
      return auth('GET', `/api/v1/domains/${segment(args, 'domain_id')}/consent-logs/stats`)
    case 'get_consent_logs':
      return auth(
        'GET',
        `/api/v1/domains/${segment(args, 'domain_id')}/consent-logs${query({ limit: clampLimit(args.limit, 100, 1000) })}`
      )
    case 'get_domain_analytics':
      return auth(
        'GET',
        `/api/v1/analytics/domains/${segment(args, 'domain_id')}/consent${query({
          start_date: args.start_date,
          end_date: args.end_date,
        })}`
      )
    default:
      throw new ToolInputError(`Unknown tool: ${name}`)
  }
}

export function errorMessage(status: number, statusText: string, body: unknown): string {
  const data = body as { detail?: unknown; message?: unknown; error?: { message?: unknown } } | null
  const detail = data?.error?.message ?? data?.detail ?? data?.message
  let text: string
  if (typeof detail === 'string') text = detail
  else if (Array.isArray(detail)) text = detail.map((d) => (d as { msg?: string }).msg ?? JSON.stringify(d)).join('; ')
  else if (detail && typeof detail === 'object') text = JSON.stringify(detail)
  else text = statusText || 'Request failed'
  if (status === 401) text += '. Check GETCOOKIE_API_KEY: create a token at https://getcookies.co/connect-claude'
  return `HTTP ${status}: ${text}`
}
