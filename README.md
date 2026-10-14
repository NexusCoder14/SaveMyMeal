# SaveMyMeal

SaveMyMeal is a surplus food-sharing web application built to connect food donors and businesses with local communities and consumers to reduce food waste.

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express.js (`backend/` is the only authoritative backend)
- **Database**: SQLite

## Run locally (Windows PowerShell)

Open two PowerShell terminals.

```powershell
cd "D:\Important Stuff\Web-Programming\SaveMyMeal\backend"
npm install
npm start
```

In the second terminal:

```powershell
cd "D:\Important Stuff\Web-Programming\SaveMyMeal\client"
npm install
npm run dev
```

The API runs at `http://localhost:3001/api` and the Vite app normally runs at
`http://localhost:5173`. Set `VITE_API_BASE_URL` in `client/.env.local` when
using another API URL. Reservations use the shared demo identity `Demo User`;
this is not authentication or authorization.

The old `server/` directory is obsolete and must not be used.
