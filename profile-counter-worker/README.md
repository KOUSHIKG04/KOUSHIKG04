# Profile Views Worker

Cloudflare Worker that requests the live `KOUSHIKG04` counter and returns one compact SVG using the same embedded Geist PixelSquare font and dark diagonal theme as `streaks-card.svg`.

## Local verification

```sh
npm test
```

## Deploy

```sh
npm install
npm run deploy
```

Public image endpoint:

`https://koushik-profile-views.koushik-profile-counter-worker.workers.dev/profile-views.svg`

Responses disable caching so GitHub's image proxy revalidates the card and the upstream counter receives profile-view requests.
