# Skyline Weather

A responsive React weather app with switchable 5-day and 14-day forecasts powered by [Open-Meteo](https://open-meteo.com/). No API key required.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Deploy

1. Create a new GitHub repository named `weather-app`.
2. In this folder, run:

```bash
git init
git add .
git commit -m "Initial weather app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/weather-app.git
git push -u origin main
```

3. On [Vercel](https://vercel.com/new), import the GitHub repository.
4. Keep framework preset **Vite**, build command **npm run build**, output directory **dist**.
5. Click **Deploy**. Vercel will automatically redeploy when you push to `main`.

The app requests 14 forecast days from Open-Meteo and lets users switch between 5-day and 14-day views without making another request.

Weather data is retrieved directly in the browser from Open-Meteo's geocoding and forecast APIs. Public, non-commercial usage is subject to Open-Meteo's terms.

## City validation
Type at least two characters to see debounced Open-Meteo Geocoding suggestions. Choose a city to load weather by its coordinates. A search with multiple matches asks you to select a city; unknown names show a validation message.
