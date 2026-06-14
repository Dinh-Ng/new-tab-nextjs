'use client'

import { useState } from 'react'
import {
  Cloud,
  CloudOff,
  HardDriveUpload,
  HardDriveDownload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDriveSync, SyncStatus } from '@/hooks/use-drive-sync'

// ─── Status icon ─────────────────────────────────────────────────────────────

function SyncStatusIcon({ status }: { status: SyncStatus }) {
  if (status === 'syncing')
    return <Loader2 className="size-3 animate-spin text-blue-400" />
  if (status === 'synced')
    return <CheckCircle2 className="size-3 text-emerald-400" />
  if (status === 'error')
    return <AlertCircle className="size-3 text-red-400" />
  return null
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoogleDriveSync() {
  const {
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
  } = useDriveSync()

  const [restoreTriggered, setRestoreTriggered] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
  const isConfigured = clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE'

  // ── Not configured ────────────────────────────────────────────────────────

  if (!isConfigured) {
    return (
      <div className="drive-sync-panel drive-sync-panel--unconfigured">
        <div className="drive-sync-header">
          <CloudOff className="size-3.5 text-muted-foreground/50" />
          <span className="drive-sync-title">Drive Backup</span>
        </div>
        <p className="drive-sync-hint">Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable.</p>
      </div>
    )
  }

  // ── Initializing ─────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="drive-sync-panel">
        <div className="drive-sync-header">
          <Loader2 className="size-3.5 animate-spin text-muted-foreground/50" />
          <span className="drive-sync-title">Drive Backup</span>
        </div>
      </div>
    )
  }

  // ── Signed out ────────────────────────────────────────────────────────────

  if (!isSignedIn) {
    return (
      <div className="drive-sync-panel">
        <div className="drive-sync-header">
          <Cloud className="size-3.5 text-muted-foreground/60" />
          <span className="drive-sync-title">Drive Backup</span>
        </div>
        <p className="drive-sync-hint">Sign in to auto-sync your data.</p>
        <button
          id="google-signin-btn"
          onClick={signIn}
          className="drive-signin-btn"
          aria-label="Sign in with Google"
        >
          {/* Google logo */}
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
        {errorMessage && (
          <p className="drive-sync-error">
            <AlertCircle className="size-3 shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>
    )
  }

  // ── Signed in ─────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    const backup = await restoreFromDrive()
    if (backup) {
      setRestoreTriggered(true)
      setTimeout(() => setRestoreTriggered(false), 3000)
      // Reload the page to refresh all component state from localStorage
      setTimeout(() => window.location.reload(), 800)
    }
  }

  return (
    <div className="drive-sync-panel drive-sync-panel--signed-in">
      {/* User info row */}
      <div className="drive-sync-user-row">
        <div className="drive-sync-avatar-wrap">
          {userInfo?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userInfo.picture}
              alt={userInfo.name}
              className="drive-sync-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="drive-sync-avatar-fallback">
              {userInfo?.name?.[0] ?? 'G'}
            </div>
          )}
          <div className="drive-sync-status-dot">
            <SyncStatusIcon status={syncStatus} />
          </div>
        </div>

        <div className="drive-sync-user-info">
          <span className="drive-sync-user-name">{userInfo?.name ?? 'Google User'}</span>
          <div className="drive-sync-status-line">
            {syncStatus === 'syncing' && <span className="drive-sync-status-text syncing">Syncing…</span>}
            {syncStatus === 'synced' && lastSyncedAt && (
              <span className="drive-sync-status-text synced">
                Synced {formatRelativeTime(lastSyncedAt)}
              </span>
            )}
            {syncStatus === 'idle' && !lastSyncedAt && (
              <span className="drive-sync-status-text idle">Auto-sync on</span>
            )}
            {syncStatus === 'error' && (
              <span className="drive-sync-status-text error">Sync error</span>
            )}
          </div>
        </div>

        <button
          onClick={signOut}
          className="drive-sync-signout-btn"
          title="Sign out"
          aria-label="Sign out from Google Drive"
        >
          <LogOut className="size-3" />
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <p className="drive-sync-error">
          <AlertCircle className="size-3 shrink-0" />
          {errorMessage}
        </p>
      )}

      {/* Action buttons */}
      <div className="drive-sync-actions">
        <Button
          id="drive-manual-backup-btn"
          variant="outline"
          size="sm"
          className="drive-sync-action-btn"
          onClick={manualBackup}
          disabled={syncStatus === 'syncing'}
          title="Backup now"
        >
          {syncStatus === 'syncing' ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <HardDriveUpload className="size-3" />
          )}
          <span>Backup</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              id="drive-restore-btn"
              variant="outline"
              size="sm"
              className="drive-sync-action-btn"
              disabled={syncStatus === 'syncing'}
              title="Restore from Drive"
            >
              {restoreTriggered ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <HardDriveDownload className="size-3" />
              )}
              <span>Restore</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RefreshCw className="size-4 text-blue-500" />
                Restore from Google Drive?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will overwrite your current local data (tasks, daily quests, shortcuts)
                with the latest backup from Google Drive. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestore}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Restore Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
