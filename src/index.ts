import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

type Bindings = {
  [key in keyof CloudflareBindings]: CloudflareBindings[key]
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/save', async (c) => {
  const body = await c.req.parseBody();

  // Check if downloadUrl is a valid URL
  const downloadUrlString = body['remote_url'] as string;
  if (!downloadUrlString) {
    throw new HTTPException(400, { message: 'Missing URL' })
  }

  if (!downloadUrlString.startsWith('http') || !downloadUrlString.includes('://')) {
    throw new HTTPException(400, { message: 'Not URL' })
  }

  // Check filename
  let filename = body['filename'] as string;
  if (!filename) {
    // Generate a random filename
    filename = Math.random().toString(36).substring(7);
  }

  // Fetch the file from the URL
  let { headers, body: stream } = await fetch(downloadUrlString)

  await c.env.HONO_R2_UPLOAD.put(filename, stream);
  console.log(`Uploaded ${filename} to R2 Complete!`)

  return c.json({
    filename
  });
})

export default app