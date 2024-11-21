import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StoryProps } from '@/app/story-reader/type'

async function getStory(id: string) {
  const dataFilePath = path.join(process.cwd(), 'data', 'stories.json')
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const stories = JSON.parse(fileContents)
    return stories.find((story: StoryProps) => story.id === id)
  } catch (error) {
    return null
  }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const story = await getStory(id)

  if (!story) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/story-reader"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        &larr; Back to all stories
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{story.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            By {story.author} | {new Date(story.createdAt).toLocaleDateString()}
          </p>
          <div className="prose max-w-none">
            {story.content.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
