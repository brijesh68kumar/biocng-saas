# Run Project Step By Step (Beginner Guide)

This guide is written for first-time users.
You can copy and run each command exactly as shown.

## 1. Open Terminal In Project Folder

In VS Code:
1. Open folder `e:\Workspace for coding`
2. Open terminal: `Terminal -> New Terminal`

Check current folder:

```powershell
pwd
```

You should see `E:\Workspace for coding`.

## 2. Start MongoDB Database

Start MongoDB service:

```powershell
Start-Service MongoDB
```

Optional: confirm status:

```powershell
Get-Service MongoDB
```

Expected: status should be `Running`.

## 3. Install Backend Dependencies (Only First Time)

```powershell
npm install
```

If this already ran earlier, you can skip.

## 4. Seed Demo Data (Create Sample Users And Masters)

```powershell
npm run seed
```

Expected output includes:
- `Seed completed`
- `Admin Email: admin@biocng.local`
- `Admin Password: Admin@123`

## 5. Start Backend API Server

Development mode (auto-restart when code changes):

```powershell
npm run dev
```

Keep this terminal running.

Expected message:
- `Connected to MongoDB`
- `Server running on port 5000`

## 6. Test Backend Quickly (Smoke Test)

Open a second terminal in same folder and run:

```powershell
npm run smoke
```

Expected:
- `Smoke test passed`
- This now validates full backend path including:
  - masters + land/crop + harvest + center + dispatch + intake
  - rate card resolution
  - weekly invoice generation and invoice listing

If smoke fails, ensure step 5 server is running.

## 7. Start Frontend (React UI)

Open a third terminal:

```powershell
cd client
npm install
npm start
```

Frontend opens on:
- `http://localhost:3000`

You should now see:
1. Login page (`BioCNG SaaS Login`)
2. After login, protected layout with sidebar navigation
3. Dashboard plus module pages (feedstock live, others placeholder)
4. Logout button to end session
5. In `Feedstock Types` page you can create records and see list from backend API

Default demo login:
1. Email: `admin@biocng.local`
2. Password: `Admin@123`

Optional frontend API URL override:
```powershell
$env:REACT_APP_API_BASE_URL="http://localhost:5000"
npm start
```

Backend API runs on:
- `http://localhost:5000`

## 8. Common Daily Workflow

Every day, usually run:

1. `Start-Service MongoDB`
2. `npm run dev` (backend)
3. `cd client` then `npm start` (frontend)

## 9. Useful Commands

Stop running server in terminal:
- Press `Ctrl + C`

Check backend root route:

```powershell
Invoke-WebRequest -Uri http://localhost:5000/ -UseBasicParsing
```

## 10. If Something Breaks

Try this reset:

```powershell
cd "e:\Workspace for coding"
npm install
npm run seed
npm run dev
```

Then in second terminal:

```powershell
npm run smoke
```

If still failing, share the full terminal error text.

## 11. After Any Code Change (Documentation Habit)

Always do this update cycle:

1. Update comments in files you changed.
2. Update `docs/context.md` with latest status.
3. Update `docs/folder-and-file-purpose.md` if structure changed.
4. Update this runbook if command flow changed.
5. Run `npm run smoke` to verify backend still works.
