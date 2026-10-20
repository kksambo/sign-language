# Sign Language Translator

Next.js app that reads webcam hand landmarks and translates ASL fingerspelling and common phrases into English. History and settings stay in your browser. There is no database.

## Run with Docker

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) and allow camera access.

## Live site

- App: [https://sign-language-sooty.vercel.app](https://sign-language-sooty.vercel.app)
- Dashboard: [https://vercel.com/kksambos-projects/sign-language](https://vercel.com/kksambos-projects/sign-language)
- Source: [https://github.com/kksambo/sign-language](https://github.com/kksambo/sign-language)

Pushes to `main` deploy automatically. Allow camera access on the live site.

## Local development

```bash
npm install
npm run dev
```
