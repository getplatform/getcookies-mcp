# getcookies-mcp

Set up a cookie consent banner from Claude, and prove that "Reject all" really rejects.

`getcookies-mcp` is the official MCP server for [GetCookies](https://getcookies.co), a cookie
consent platform (CMP). Your AI assistant can add a website, scan its cookies,
configure a GDPR/CCPA banner with Google Consent Mode v2, hand you the one-line install code,
check that it is live and run a Reject all test, in one conversation.

> "Add example.com to GetCookies, scan it, set up a bottom-right banner with Google Consent
> Mode and give me the install code."

## Quick start (2 minutes)

1. Create a free GetCookies account and a personal access token at
   [getcookies.co/connect-claude](https://getcookies.co/connect-claude). Tokens work on every
   plan, including Free.
2. Add the server to your client.

**Claude Code**

```bash
claude mcp add getcookies -e GETCOOKIE_API_KEY=gcpat_... -- npx -y getcookies-mcp
```

**Claude Desktop** (`claude_desktop_config.json`), **Cursor** (`~/.cursor/mcp.json`) and other
clients that use the `mcpServers` format:

```json
{
  "mcpServers": {
    "getcookies": {
      "command": "npx",
      "args": ["-y", "getcookies-mcp"],
      "env": { "GETCOOKIE_API_KEY": "gcpat_..." }
    }
  }
}
```

Restart the client, then ask: "Which GetCookies account am I connected to?"

Requires Node.js 18 or later. The server runs locally over stdio and talks only to
`api.getcookies.co`.

## Things to ask

- "Add shop.example.com to GetCookies and scan it. Which cookies are marketing?"
- "Set up a banner that holds back Meta, TikTok and Hotjar until visitors agree, with Consent
  Mode v2 in Advanced mode, and give me the install code."
- "Is the banner installed on example.com yet?"
- "Run the Reject all test on https://example.com and tell me what still fires."
- "How many visitors accepted or rejected cookies on example.com last month?"
- "Show me the last 20 consent records for example.com."

## Tools

| Tool | What it does | Changes data |
|------|--------------|:---:|
| `whoami` | Shows the account the token belongs to (use it to check the setup) | |
| `list_domains`, `get_domain` | Your websites and their install state | |
| `create_domain` | Adds a website and returns its `domain_id` | Yes |
| `initiate_scan` | Starts a cookie scan | Yes |
| `get_scan_status` | Follows a scan to completion | |
| `get_scan_cookies` | Cookies the scan found, with categories | |
| `classify_cookie` | Sets the category of a detected cookie | Yes |
| `get_widget_config` | Reads the banner configuration | |
| `update_widget_config` | Changes the banner: text, position, Reject all, regional rules, Consent Mode (Advanced or Basic), automatic tracker blocking. Only the fields you pass change | Yes |
| `get_widget_snippet` | The one-line install code for `<head>` | |
| `verify_install` | Checks that the banner script is live on the site | |
| `run_reject_test` | Loads any URL, clicks Reject all and lists the trackers and cookies that still fire, next to what fires before consent | |
| `get_consent_stats`, `get_domain_analytics` | Accept and reject rates over time | |
| `get_consent_logs` | Consent records for an audit trail | |

No tool deletes anything.

## What the banner does

- Known trackers (Meta Pixel, TikTok, LinkedIn, Hotjar, Microsoft Clarity and about 20 more) wait
  until the visitor agrees and stay off after Reject all. On by default for new sites, on every
  plan.
- Google Consent Mode v2 (Advanced or Basic) on every plan, including Free.
- Reject all is as prominent as Accept all, and can't be hidden under EU and UK rules.
- GDPR or US opt-out rules by visitor region; Global Privacy Control honoured.
- Every choice logged with the button clicked, banner version and page.
- Flat pricing: Free for 1 site, then EUR 9, 29 or 79 a month for 3, 5 or up to 50 sites. No
  pageview limits. See [getcookies.co/pricing](https://getcookies.co/pricing).

## Security

A token can manage sites, scans and banners only. It cannot change passwords, billing, teams
or other tokens, cannot delete anything, and can be revoked at any time at
[getcookies.co/connect-claude](https://getcookies.co/connect-claude). Keep it in the client's
`env` block, not in prompts.

## Limits

- The Reject all test takes 30 to 60 seconds and runs at most 5 times per hour.
- Scans per month and pages per scan follow your GetCookies plan (Free: 3 scans of up to 50 pages).
- The tools set up and check a banner; they don't give legal advice or certify that a site is compliant.

## Troubleshooting

- **"GETCOOKIE_API_KEY is required"**: the client did not pass the token. Put it in the server's `env` block and restart the client.
- **401 errors**: the token was revoked or mistyped. Create a new one at
  [getcookies.co/connect-claude](https://getcookies.co/connect-claude).
- **"enterprise API key (olc_)"**: the server needs a personal access token starting with `gcpat_`.
- **The banner doesn't show after install**: ask Claude to run `verify_install`; the install code must be the first
  script in `<head>`.

## Configuration

| Variable | Required | Default |
|----------|----------|---------|
| `GETCOOKIE_API_KEY` | Yes: a personal access token starting with `gcpat_` | |
| `GETCOOKIE_API_URL` | No | `https://api.getcookies.co` |

## Upgrading from `getcookie-mcp`

This package was published as `getcookie-mcp` up to version 1.1.0. That name is deprecated:
replace `getcookie-mcp` with `getcookies-mcp` in your client configuration. The token and
`GETCOOKIE_API_KEY` stay the same, and a global install still provides a `getcookie-mcp` command
so existing setups keep working.

## Links

- [Claude and MCP integration guide](https://getcookies.co/integrations/claude-code)
- [Free cookie scanner and Reject all test](https://getcookies.co/free-scan)
- Support: support@getcookies.co

MIT licensed. Made by Getia AS, Oslo.
