# Sign Language Translator

Next.js app that reads webcam hand landmarks and translates ASL fingerspelling and common phrases into English. History and settings stay in your browser. There is no database.

## Run with Docker

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) and allow camera access.

## Deploy to Vercel

No database or env vars are required. Push the project to GitHub, then import it at [vercel.com/new](https://vercel.com/new). Or from this folder:

```bash
npx vercel
```

The camera only works over HTTPS, which Vercel provides. Allow camera access on the live site.

## Local development

```bash
npm install
npm run dev
```
