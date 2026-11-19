import { describe, expect, it } from 'vitest'
import { TOOLS, ToolInputError, errorMessage, planRequest } from './tools'

const DOMAIN = '11111111-2222-3333-4444-555555555555'

describe('planRequest', () => {
  it('update_widget_config sends only known fields, with the backend field names', () => {
    const plan = planRequest('update_widget_config', {
      domain_id: DOMAIN,
      position: 'bottom-right',
      google_consent_mode_enabled: true,
      consent_mode_type: 'advanced',
      google_consent_mode: true,
      unknown_field: 'x',
    })
    expect(plan).toEqual({
      method: 'POST',
      path: `/api/v1/domains/${DOMAIN}/widget`,
      body: { position: 'bottom-right', google_consent_mode_enabled: true, consent_mode_type: 'advanced' },
      authenticated: true,
    })
  })

  it('update_widget_config refuses an empty change', () => {
    expect(() => planRequest('update_widget_config', { domain_id: DOMAIN })).toThrow(ToolInputError)
  })

  it('get_domain_analytics calls the route that exists', () => {
    expect(planRequest('get_domain_analytics', { domain_id: DOMAIN, start_date: '2026-11-01' }).path).toBe(
      `/api/v1/analytics/domains/${DOMAIN}/consent?start_date=2026-11-01`
    )
  })

  it('classify_cookie uses the backend categories', () => {
    const tool = TOOLS.find((t) => t.name === 'classify_cookie')!
    expect((tool.inputSchema.properties.category as { enum: string[] }).enum).toEqual([
      'necessary',
      'analytics',
      'marketing',
      'unknown',
    ])
    expect(planRequest('classify_cookie', { cookie_id: 'c1', category: 'marketing' })).toMatchObject({
      method: 'PATCH',
      path: '/api/v1/cookies/c1',
      body: { category: 'marketing' },
    })
  })

  it('widget positions match the backend pattern', () => {
    const positions = (TOOLS.find((t) => t.name === 'update_widget_config')!.inputSchema.properties
      .position as { enum: string[] }).enum
    expect(positions).not.toContain('bottom')
    expect(positions).toContain('bottom-left')
  })

  it('setup flow maps to the dashboard API', () => {
    expect(planRequest('create_domain', { domain: ' example.com ' })).toEqual({
      method: 'POST',
      path: '/api/v1/domains',
      body: { domain: 'example.com' },
      authenticated: true,
    })
    expect(planRequest('initiate_scan', { domain_id: DOMAIN }).path).toBe(`/api/v1/domains/${DOMAIN}/scans`)
    expect(planRequest('get_scan_cookies', { scan_id: 's1', limit: 5000 }).path).toBe(
      '/api/v1/scans/s1/cookies?limit=1000'
    )
    expect(planRequest('get_widget_snippet', { domain_id: DOMAIN }).path).toBe(
      `/api/v1/domains/${DOMAIN}/widget/snippet`
    )
    expect(planRequest('verify_install', { domain_id: DOMAIN }).method).toBe('POST')
  })

  it('run_reject_test uses the public scanner without the token', () => {
    expect(planRequest('run_reject_test', { url: 'https://example.com' })).toEqual({
      method: 'POST',
      path: '/api/v1/public/scan',
      body: { url: 'https://example.com' },
      authenticated: false,
    })
  })

  it('ids are path-encoded and required', () => {
    expect(planRequest('get_scan_status', { scan_id: '../admin' }).path).toBe('/api/v1/scans/..%2Fadmin')
    expect(() => planRequest('get_domain', {})).toThrow('domain_id is required')
    expect(() => planRequest('nope', {})).toThrow('Unknown tool')
  })

  it('every tool can be planned', () => {
    for (const tool of TOOLS) {
      const args: Record<string, unknown> = {}
      for (const key of tool.inputSchema.required ?? []) args[key] = key === 'category' ? 'necessary' : 'x'
      if (tool.name === 'update_widget_config') args.theme = 'dark'
      expect(() => planRequest(tool.name, args)).not.toThrow()
    }
  })
})

describe('errorMessage', () => {
  it('reads FastAPI and GetCookies error shapes', () => {
    expect(errorMessage(403, 'Forbidden', { detail: 'lacks scope' })).toBe('HTTP 403: lacks scope')
    expect(errorMessage(400, '', { error: { message: 'bad' } })).toBe('HTTP 400: bad')
    expect(errorMessage(422, '', { detail: [{ msg: 'field required' }] })).toBe('HTTP 422: field required')
    expect(errorMessage(401, 'Unauthorized', { detail: 'Invalid access token' })).toContain('connect-claude')
  })
})
