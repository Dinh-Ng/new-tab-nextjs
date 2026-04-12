'use client'

import React, { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Settings2, Trash, Edit2, Globe, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Shortcut = {
  id: string
  name: string
  url: string
}

export function TopSites() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [form, setForm] = useState<{ id: string; name: string; url: string }>({ id: '', name: '', url: '' })

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_shortcuts')
    if (saved) {
      try {
        setShortcuts(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse shortcuts', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('dashboard_shortcuts', JSON.stringify(shortcuts))
  }, [shortcuts])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    let finalUrl = form.url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    if (form.id) {
      setShortcuts(shortcuts.map(s => s.id === form.id ? { ...s, name: form.name, url: finalUrl } : s))
    } else {
      setShortcuts([...shortcuts, { id: Date.now().toString(), name: form.name, url: finalUrl }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setShortcuts(shortcuts.filter(s => s.id !== id))
  }

  const openForm = (shortcut?: Shortcut) => {
    if (shortcut) {
      setForm({ id: shortcut.id, name: shortcut.name, url: shortcut.url })
    } else {
      setForm({ id: '', name: '', url: '' })
    }
    setDialogOpen(true)
  }

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    } catch {
      return null
    }
  }

  return (
    <div className="w-full flex justify-center py-6">
      <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 lg:gap-8 max-w-4xl">
        
        {shortcuts.map(site => (
          <div key={site.id} className="relative group w-16 sm:w-20 text-center flex flex-col items-center">
            {isEditing && (
              <>
                <button
                  onClick={() => openForm(site)}
                  className="absolute -top-2 -right-2 z-10 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-1.5rem]"
                >
                  <Edit2 className="size-3" />
                </button>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </>
            )}

            <a
              href={isEditing ? undefined : site.url}
              className="flex justify-center items-center size-12 sm:size-14 bg-background/50 backdrop-blur border shadow-sm rounded-full mb-2 hover:bg-muted/80 transition-colors"
            >
              {getFaviconUrl(site.url) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={getFaviconUrl(site.url) as string} 
                  alt={site.name} 
                  className="size-6 sm:size-7 rounded-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '' // Fallback to missing logic via a clear string 
                  }}
                />
              ) : (
                <Globe className="size-5 text-muted-foreground" />
              )}
            </a>
            <span className="text-xs sm:text-sm font-medium w-full truncate px-1 opacity-90">{site.name}</span>
          </div>
        ))}

        <Dialog open={dialogOpen} onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o && !isEditing) setForm({ id: '', name: '', url: '' }) // Clear on close if adding
        }}>
          <div className="flex flex-col items-center">
            <button
              onClick={() => openForm()}
              className="flex justify-center items-center size-12 sm:size-14 bg-background/30 backdrop-blur border border-dashed hover:border-solid hover:bg-muted transition-colors rounded-full mb-2"
            >
              <Plus className="size-5 text-muted-foreground" />
            </button>
            <span className="text-xs sm:text-sm font-medium w-full truncate px-1 opacity-90 text-center">Add Site</span>
          </div>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit Shortcut' : 'Add Shortcut'}</DialogTitle>
              <DialogDescription>
                Provide a name and URL for your shortcut.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                  placeholder="e.g., GitHub"
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={e => setForm({...form, url: e.target.value})}
                  required
                  placeholder="e.g., github.com"
                />
              </div>
              <Button type="submit" className="w-full">Save Shortcut</Button>
            </form>
          </DialogContent>
        </Dialog>

        {shortcuts.length > 0 && (
          <div className="flex flex-col items-center ml-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex justify-center items-center size-8 bg-background/30 backdrop-blur border rounded-full mt-3 transition-colors ${isEditing ? 'bg-primary/20 border-primary shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
              title="Edit Shortcuts"
            >
               <Settings2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
