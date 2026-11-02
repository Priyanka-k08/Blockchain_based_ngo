# KindLedger Trust

Original full-stack NGO donation and transparency platform for a final-year project. Functional inspiration came from public charity sites (campaigns, in-kind giving, impact numbers). The UI, copy, data model and code are original.

The app stores ordinary records in **MySQL**. Only completed **donations** and **fund-utilization expenses** receive a **SHA-256** seal and a transaction reference (`KL-LEDGER-…`). That payload is ready to publish to a blockchain later without putting the whole website on chain.

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, JWT
- Database: MySQL 8

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@kindledger.org` | `Admin@123` |
| Donor | `donor@kindledger.org` | `Donor@123` |

## Run locally

1. Start MySQL (Docker is simplest):

```bash
docker compose up -d
```

2. Backend:

```bash
cd backend
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`
`JWT_SECRET` is optional for local development. Set a long, random `JWT_SECRET` in `backend/.env` before deploying.

3. Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev
```

Site: `http://localhost:5173`

If Docker is unavailable, XAMPP MySQL also works. Set `backend/.env` to `DB_USER=root` and an empty `DB_PASSWORD` (do not omit the key — an unset password falls back to `kindledger`). Then run `npm run seed`.

## Payments, WhatsApp and live records

- Checkout creates a **Razorpay order**. If `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are empty, a demo gateway still verifies the payment locally.
- After a successful payment the donor gets a **WhatsApp confirmation**. Set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API) to send live; otherwise the text is stored in the admin WhatsApp log.
- Public utilization and audit rows appear **only after an admin publishes** them. Publishing an expense also WhatsApps campaign donors a **field video** of how the amount was used.
- Public pages subscribe to `/api/events` (SSE) so they refresh when an admin publishes.
- After payment, the receipt page asks for a **1–5 rating and review**.

## Modules

- Home, about, contact
- Register / login / profile
- Campaign browse, filter, details, progress
- Simulated money donation + printable receipt
- Razorpay checkout (live keys or demo) + WhatsApp confirmation
- Extra causes: feed people, feed animals, education, senior citizens, disability support
- Post-donation rating / review
- In-kind store pledges
- Approved beneficiaries
- Fund utilization table
- Public audit desk (recompute hashes)
- Impact charts
- Admin desk: users, campaigns, donations, beneficiaries, store, expenses, reports

## Hash design

Canonical JSON of selected fields is hashed with SHA-256. Example donation payload: `id`, `donor_id`, `campaign_id`, `amount`, `currency`, `receipt_no`, `created_at`. Verification endpoint: `GET /api/verify/donation/:id` or `/api/verify/expense/:id`.
