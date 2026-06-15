/**
 * Google Drive integration for NexTab
 * Uses manual OAuth implicit redirect flow + Drive REST API
 * All data is stored in Drive's appDataFolder (private, only visible to this app)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GoogleUserInfo {
  name: string
  email: string
  picture: string
}

export interface NexTabBackup {
  version: number
  exportedAt: string
  tasks: unknown
  daily_quests_games: unknown
  dashboard_shortcuts: unknown
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BACKUP_FILE_NAME = 'nextab-backup.json'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

/** sessionStorage key where the callback page writes the token */
export const OAUTH_TOKEN_KEY = 'nextab_oauth_token'
export const OAUTH_EXPIRES_KEY = 'nextab_oauth_expires'

// ─── Redirect-based OAuth ─────────────────────────────────────────────────────

/** Returns the absolute callback URL registered in Google Cloud Console */
function getRedirectUri(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}

/**
 * Redirects the browser to Google's OAuth consent screen.
 * The user is sent back to /auth/callback with the token in the URL hash.
 */
export function redirectToGoogleOAuth(clientId: string): void {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'select_account',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ─── Token Management ─────────────────────────────────────────────────────────

let currentToken: string | null = null
let tokenExpiresAt = 0

/**
 * Call this on app startup to restore a token previously saved by the
 * OAuth callback page (stored in sessionStorage).
 */
export function restoreTokenFromSession(): boolean {
  if (typeof window === 'undefined') return false
  const token = sessionStorage.getItem(OAUTH_TOKEN_KEY)
  const expires = sessionStorage.getItem(OAUTH_EXPIRES_KEY)
  if (!token || !expires) return false
  const expiresAt = parseInt(expires, 10)
  if (Date.now() >= expiresAt) {
    sessionStorage.removeItem(OAUTH_TOKEN_KEY)
    sessionStorage.removeItem(OAUTH_EXPIRES_KEY)
    return false
  }
  currentToken = token
  tokenExpiresAt = expiresAt
  return true
}

/**
 * Called by the /auth/callback page after parsing the token from the URL hash.
 */
export function saveTokenToSession(accessToken: string, expiresIn: number): void {
  const expiresAt = Date.now() + (expiresIn - 60) * 1000
  sessionStorage.setItem(OAUTH_TOKEN_KEY, accessToken)
  sessionStorage.setItem(OAUTH_EXPIRES_KEY, String(expiresAt))
  currentToken = accessToken
  tokenExpiresAt = expiresAt
}

export function isTokenValid(): boolean {
  return !!currentToken && Date.now() < tokenExpiresAt
}

export function clearToken(): void {
  currentToken = null
  tokenExpiresAt = 0
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(OAUTH_TOKEN_KEY)
    sessionStorage.removeItem(OAUTH_EXPIRES_KEY)
  }
}

function getAuthHeaders(): HeadersInit {
  if (!currentToken) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${currentToken}` }
}

// ─── User Info ────────────────────────────────────────────────────────────────

export async function fetchUserInfo(): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch user info')
  const data = await res.json()
  return {
    name: data.name ?? '',
    email: data.email ?? '',
    picture: data.picture ?? '',
  }
}

// ─── Drive File Operations ────────────────────────────────────────────────────

async function findBackupFileId(): Promise<string | null> {
  const res = await fetch(
    `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='${BACKUP_FILE_NAME}'&fields=files(id,name)`,
    { headers: getAuthHeaders() }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

export async function uploadBackup(backup: NexTabBackup): Promise<void> {
  const body = JSON.stringify(backup, null, 2)
  const existingId = await findBackupFileId()

  if (existingId) {
    // Update existing file
    const res = await fetch(
      `${DRIVE_UPLOAD_BASE}/files/${existingId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body,
      }
    )
    if (!res.ok) throw new Error('Failed to update backup on Drive')
  } else {
    // Create new file in appDataFolder
    const metadata = {
      name: BACKUP_FILE_NAME,
      parents: ['appDataFolder'],
    }
    const form = new FormData()
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    form.append('file', new Blob([body], { type: 'application/json' }))

    const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    })
    if (!res.ok) throw new Error('Failed to create backup on Drive')
  }
}

export async function downloadBackup(): Promise<NexTabBackup | null> {
  const fileId = await findBackupFileId()
  if (!fileId) return null

  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) return null
  return res.json()
}

// ─── Backup Helpers ───────────────────────────────────────────────────────────

export const BACKUP_KEYS = ['tasks', 'daily_quests_games', 'dashboard_shortcuts'] as const
type BackupKey = (typeof BACKUP_KEYS)[number]

export function collectLocalStorageData(): NexTabBackup {
  const result: Partial<NexTabBackup> = {
    version: 1,
    exportedAt: new Date().toISOString(),
  }
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key)
    try {
      result[key as BackupKey] = raw ? JSON.parse(raw) : null
    } catch {
      result[key as BackupKey] = null
    }
  }
  return result as NexTabBackup
}

export function restoreToLocalStorage(backup: NexTabBackup): void {
  for (const key of BACKUP_KEYS) {
    const value = backup[key as BackupKey]
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }
}
