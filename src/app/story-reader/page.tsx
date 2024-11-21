import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import StoryUploadForm from './components/StoryUploadForm'

async function getStories() {
  const dataFilePath = path.join(process.cwd(), 'data', 'stories.json')
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return []
  }
}

export default async function Home() {
  const stories = await getStories()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Story Reader</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Upload a Story</h2>
          <StoryUploadForm />
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Recent Stories</h2>
          {stories.length > 0 ? (
            <div className="space-y-4">
              {stories.map((story) => (
                <Card key={story.id}>
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={`/story-reader/story/${story.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {story.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">By {story.author}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No stories uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
