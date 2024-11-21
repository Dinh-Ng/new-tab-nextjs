import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req) {
  try {
    const { title, content, author } = await req.json()

    const story = {
      id: Date.now().toString(),
      title,
      content,
      author,
      createdAt: new Date().toISOString(),
    }

    const dataDir = path.join(process.cwd(), 'data')
    const dataFilePath = path.join(dataDir, 'stories.json')

    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true })

    let stories = []
    try {
      const fileContents = await fs.readFile(dataFilePath, 'utf8')
      stories = JSON.parse(fileContents)
    } catch (error) {
      // If the file doesn't exist or is empty, we'll start with an empty array
      console.log('No existing stories found, starting with an empty array')
    }

    stories.push(story)

    await fs.writeFile(dataFilePath, JSON.stringify(stories, null, 2))

    return new Response(JSON.stringify({ message: 'Story uploaded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in upload-story route:', error)
    return new Response(JSON.stringify({ message: 'Failed to upload story', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
