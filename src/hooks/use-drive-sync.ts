'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  clearToken,
  collectLocalStorageData,
  downloadBackup,
  fetchUserInfo,
  GoogleUserInfo,
  isTokenValid,
  NexTabBackup,
  redirectToGoogleOAuth,
  restoreToLocalStorage,
  restoreTokenFromSession,
  uploadBackup,
} from '@/lib/google-drive'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export interface DriveSync {
  isSignedIn: boolean
  isInitializing: boolean
  userInfo: GoogleUserInfo | null
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  errorMessage: string | null
  signIn: () => void
  signOut: () => void
  manualBackup: () => Promise<void>
  restoreFromDrive: () => Promise<NexTabBackup | null>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 3000

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDriveSync(): DriveSync {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

  // ── Restore token from session on mount ───────────────────────────────────
  // After the OAuth redirect, /auth/callback stores the token in sessionStorage.
  // We pick it up here and restore the signed-in state.

  useEffect(() => {
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setIsInitializing(false)
      return
    }

    const hasToken = restoreTokenFromSession()
    if (hasToken) {
      setIsSignedIn(true)
      fetchUserInfo()
        .then((info) => setUserInfo(info))
        .catch(() => {/* user info is optional */})
    }
    setIsInitializing(false)
  }, [clientId])

  // ── Auto-sync listener ────────────────────────────────────────────────────

  const performUpload = useCallback(async () => {
    if (!isTokenValid()) return
    try {
      setSyncStatus('syncing')
      setErrorMessage(null)
      const backup = collectLocalStorageData()
      await uploadBackup(backup)
      setLastSyncedAt(new Date())
      setSyncStatus('synced')
    } catch (err) {
      console.error('Drive sync error:', err)
      setSyncStatus('error')
      setErrorMessage('Backup failed. Check your connection.')
    }
  }, [])

  const scheduleDebouncedUpload = useCallback(() => {
    if (!isSignedIn) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      performUpload()
    }, DEBOUNCE_MS)
  }, [isSignedIn, performUpload])

  useEffect(() => {
    const handler = () => scheduleDebouncedUpload()
    window.addEventListener('localStorageChanged', handler)
    return () => {
      window.removeEventListener('localStorageChanged', handler)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [scheduleDebouncedUpload])

  // ── Actions ───────────────────────────────────────────────────────────────

  // Redirect the browser to Google's OAuth page.
  // No popup — the user navigates away and comes back via /auth/callback.
  const signIn = useCallback(() => {
    if (!clientId) return
    setErrorMessage(null)
    redirectToGoogleOAuth(clientId)
  }, [clientId])

  const signOut = useCallback(() => {
    clearToken()
    setIsSignedIn(false)
    setUserInfo(null)
    setSyncStatus('idle')
    setLastSyncedAt(null)
    setErrorMessage(null)
  }, [])

  const manualBackup = useCallback(async () => {
    if (!isTokenValid()) {
      setErrorMessage('Please sign in first.')
      return
    }
    await performUpload()
  }, [performUpload])

  const restoreFromDrive = useCallback(async (): Promise<NexTabBackup | null> => {
    if (!isTokenValid()) {
      setErrorMessage('Please sign in first.')
      return null
    }
    try {
      setSyncStatus('syncing')
      setErrorMessage(null)
      const backup = await downloadBackup()
      if (backup) {
        restoreToLocalStorage(backup)
        setLastSyncedAt(new Date())
        setSyncStatus('synced')
        return backup
      } else {
        setSyncStatus('idle')
        setErrorMessage('No backup found on Drive.')
        return null
      }
    } catch (err) {
      console.error('Drive restore error:', err)
      setSyncStatus('error')
      setErrorMessage('Restore failed. Check your connection.')
      return null
    }
  }, [])

  return {
    isSignedIn,
    isInitializing,
    userInfo,
    syncStatus,
    lastSyncedAt,
    errorMessage,
    signIn,
    signOut,
    manualBackup,
    restoreFromDrive,
  }
}
