const FRIENDLY_NAMES: Record<string, string> = {
  'github.com': 'GitHub',
  'x.com': 'X',
  'twitter.com': 'X',
  'claude.ai': 'Claude',
  'chat.openai.com': 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
  'docs.google.com': 'Google Docs',
  'sheets.google.com': 'Google Sheets',
  'slides.google.com': 'Google Slides',
  'drive.google.com': 'Google Drive',
  'mail.google.com': 'Gmail',
  'calendar.google.com': 'Google Calendar',
  'meet.google.com': 'Google Meet',
  'youtube.com': 'YouTube',
  'www.youtube.com': 'YouTube',
  'stackoverflow.com': 'Stack Overflow',
  'www.reddit.com': 'Reddit',
  'reddit.com': 'Reddit',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'www.figma.com': 'Figma',
  'slack.com': 'Slack',
  'app.slack.com': 'Slack',
  'discord.com': 'Discord',
  'vercel.com': 'Vercel',
  'netlify.com': 'Netlify',
  'amazon.com': 'Amazon',
  'www.amazon.com': 'Amazon',
  'news.ycombinator.com': 'Hacker News',
  'medium.com': 'Medium',
  'dev.to': 'DEV',
  'linear.app': 'Linear',
  'jira.atlassian.com': 'Jira',
  'console.cloud.google.com': 'Google Cloud',
  'console.aws.amazon.com': 'AWS',
  'portal.azure.com': 'Azure',
  'npmjs.com': 'npm',
  'www.npmjs.com': 'npm',
  'localhost': 'Localhost',
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'chrome:' || parsed.protocol === 'chrome-extension:') {
      return 'chrome'
    }
    if (parsed.protocol === 'about:' || parsed.protocol === 'data:') {
      return 'other'
    }
    let hostname = parsed.hostname
    if (hostname.startsWith('www.') && !FRIENDLY_NAMES[hostname]) {
      hostname = hostname.slice(4)
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `localhost${parsed.port ? ':' + parsed.port : ''}`
    }
    return hostname
  } catch {
    return 'other'
  }
}

export function getFriendlyName(domain: string): string {
  if (FRIENDLY_NAMES[domain]) return FRIENDLY_NAMES[domain]

  if (domain === 'chrome') return 'Chrome'
  if (domain === 'other') return 'Other'
  if (domain.startsWith('localhost')) return 'Localhost'

  // Try with www prefix
  if (FRIENDLY_NAMES['www.' + domain]) return FRIENDLY_NAMES['www.' + domain]

  // Capitalize the second-level domain
  const parts = domain.split('.')
  if (parts.length >= 2) {
    const name = parts[parts.length - 2]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return domain
}

export function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'chrome:' || parsed.protocol === 'chrome-extension:') {
      return ''
    }
    // Use Chrome's built-in favicon service
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=16`
  } catch {
    return ''
  }
}
