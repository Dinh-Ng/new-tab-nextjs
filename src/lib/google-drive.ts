/**
 * Google Drive integration for NexTab
 * Uses Google Identity Services (GIS) token-based flow + Drive REST API
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

// ─── GIS Script Loader ───────────────────────────────────────────────────────

let gisLoaded = false

export function loadGISScript(): Promise<void> {
  if (gisLoaded || typeof window === 'undefined') return Promise.resolve()
  if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
    gisLoaded = true
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      gisLoaded = true
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// ─── Token Client ────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  expires_in: number
  error?: string
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
}

let tokenClient: TokenClient | null = null
let currentToken: string | null = null
let tokenExpiresAt = 0

export function initTokenClient(
  clientId: string,
  onToken: (token: string) => void,
  onError: (err: unknown) => void
): void {
  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) return

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (response: TokenResponse) => {
      if (response.error) {
        onError(response.error)
        return
      }
      currentToken = response.access_token
      tokenExpiresAt = Date.now() + (response.expires_in - 60) * 1000
      onToken(response.access_token)
    },
  })
}

export function requestToken(prompt?: string): void {
  // Only pass prompt when explicitly set — an empty string behaves differently
  // from omitting it and can force the popup flow in GIS.
  tokenClient?.requestAccessToken(prompt ? { prompt } : {})
}

export function isTokenValid(): boolean {
  return !!currentToken && Date.now() < tokenExpiresAt
}

export function clearToken(): void {
  if (currentToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(currentToken, () => {})
  }
  currentToken = null
  tokenExpiresAt = 0
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

// ─── Global type augment ─────────────────────────────────────────────────────

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
          }) => TokenClient
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}
