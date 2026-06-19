# Lahana Resort — Complete System Implementation Plan
## Private Install · Single-Tenant · Web-Based (All Devices)
**Derived from:** SIA HMS SaaS codebase (github.com/sudip-parajuli/HotelManagementSaaS)
**Version:** 1.0 | **Prepared By:** SIA Enterprises | **Type:** Antigravity Task Plan

---

> **HOW TO USE THIS FILE**
> Hand this to Antigravity at the start of each session.
> Work phase by phase, task by task.
> Update LAHANA_PROGRESS.md after every session.
> At quota limit → use the Handoff Prompt in Section 8.

---

## TABLE OF CONTENTS

1. [Architecture Decision — Web App vs Native App](#1-architecture-decision)
2. [What We Reuse vs What We Change](#2-what-we-reuse-vs-what-we-change)
3. [Project Setup — Clone & Strip SaaS Layer](#3-project-setup)
4. [Phase L1 — Lahana Branding & Single-Tenant Config](#4-phase-l1)
5. [Phase L2 — Website Booking Sync](#5-phase-l2)
6. [Phase L3 — Waiter Mobile Ordering (PWA)](#6-phase-l3)
7. [Phase L4 — Lahana-Specific Features](#7-phase-l4)
8. [Phase L5 — Deployment on Lahana's Server](#8-phase-l5)
9. [Phase L6 — Staff Training & Handover](#9-phase-l6)
10. [Handoff Prompt](#10-handoff-prompt)
11. [Master Checklist](#11-master-checklist)

---

## 1. Architecture Decision

### "They want a software installed on their platform" — What This Actually Means

This is the most important thing to understand before writing a single line of code.

Lahana Resort wants:
- ✅ Works on their desktop PC at reception
- ✅ Works on tablets carried by managers
- ✅ Works on waiters' mobile phones for order taking
- ✅ Syncs with their existing website bookings
- ✅ Private — their data stays with them
- ✅ No paperwork, no manual records

**This does NOT require a native app (no .exe, no Play Store, no App Store).**

A web application accessed through a browser does ALL of the above. Your existing Next.js codebase already runs on every device that has a browser — which is every device on earth made after 2010. Adding a PWA manifest (a single JSON file + service worker) makes it installable on the home screen of any phone or tablet, indistinguishable from a native app to the user.

**Building a native app instead would:**
- Add 6–12 months of development
- Require React Native or Flutter (new codebase from zero)
- Require App Store / Play Store accounts and approval processes
- Not reuse a single line of the existing SIA HMS code
- Cost the client 3–5x more
- Make website booking sync significantly harder

**Conclusion: Web App + PWA is the correct choice. The client does not know the difference once it's installed on their devices. Do not rebuild as native.**

### Deployment Architecture for Lahana

```
Lahana Resort Network
│
├── Reception PC (Windows)
│   └── Chrome browser → http://pms.lahanaresort.com
│
├── Manager's Laptop
│   └── Chrome/Safari → http://pms.lahanaresort.com
│
├── Waiter's Android Phone
│   └── PWA installed on home screen → pms.lahanaresort.com/pos
│       (looks and feels like a native app, works offline for order entry)
│
├── Kitchen TV / Tablet
│   └── Chrome fullscreen → pms.lahanaresort.com/pos/kds
│
└── Lahana's Existing Website (lahanaresort.com)
    └── Booking widget embedded via <iframe>
        OR API webhook → SIA HMS booking API
```

Everything runs through one server (Lahana's own VPS or a VPS they rent).
No App Store. No .exe installer. No second codebase.

---

## 2. What We Reuse vs What We Change

### From SIA HMS SaaS → Lahana Private Install

| Component | Action | Notes |
|---|---|---|
| Django backend (all 10 apps) | ✅ Reuse 95% | Remove SaaS billing, multi-tenant routing |
| Next.js frontend (all pages) | ✅ Reuse 90% | Remove SaaS pages, re-brand to Lahana |
| PostgreSQL schema | ✅ Reuse — simplify | Single schema, no django-tenants routing needed |
| Redis + Celery | ✅ Reuse 100% | Background jobs unchanged |
| MinIO storage | ✅ Reuse 100% | Same file storage |
| eSewa + Khalti + Fonepay | ✅ Reuse 100% | Payment gateways unchanged |
| WeasyPrint PDF invoices | ✅ Reuse 100% | Brand with Lahana logo |
| Nepali / English i18n | ✅ Reuse 100% | Already built in Phase 11 |
| WebSocket KDS / Housekeeping | ✅ Reuse 100% | Unchanged |
| docker-compose.yml | ✅ Reuse, simplify | Remove multi-tenant env vars |
| **SaaS subscription models** | ❌ Remove | Lahana doesn't need billing tiers |
| **django-tenants middleware** | ❌ Remove / bypass | Single tenant — no schema routing needed |
| **Super Admin SaaS panel** | ❌ Remove from UI | Replace with Lahana Admin panel |
| **Public SaaS landing page** | ❌ Remove | Lahana has their own website |
| **Tenant onboarding wizard** | ❌ Remove | One client, already onboarded |
| **Impersonation feature** | ❌ Remove | Not needed for private install |
| **MRR / SaaS metrics** | ❌ Remove | Irrelevant for private install |

### What's New (Lahana-Specific)

| Feature | Why | Effort |
|---|---|---|
| Website booking sync | Lahana has existing website, bookings must flow in | Medium |
| PWA manifest + service worker | Makes system installable on phones/tablets | Low |
| Offline order entry (waiters) | Internet may drop mid-service | Medium |
| Lahana branding throughout | Logo, colors, name in all pages and PDF | Low |
| Lahana room/villa seed data | Pre-load their actual rooms, rates, staff | Low |
| QR code per table | Waiters scan table QR → open order screen | Low |
| Guest-facing digital menu | Guests scan QR → browse menu on phone | Medium |

---

## 3. Project Setup

### Task S.1 — Clone and Create Lahana Branch

```
PROMPT TO ANTIGRAVITY:

We are creating a private install version of the SIA HMS SaaS project
specifically for Lahana Resort. This is NOT a new project — it is the
same codebase configured for single-tenant use.

Steps:

1. The source repo is: github.com/sudip-parajuli/HotelManagementSaaS
   Create a new private repo: github.com/sudip-parajuli/lahana-resort-hms
   Clone the SaaS repo and push to the new private repo.

2. In the new repo, create a branch structure:
   - main (production — what runs on Lahana's server)
   - dev (active development)
   All work happens on dev, merged to main for deployment.

3. Create LAHANA_PROGRESS.md in the root — same format as PROGRESS.md
   but tracking Lahana-specific work.

4. In .env.example, add a flag:
   DEPLOYMENT_MODE=single_tenant
   This will be used throughout the codebase to skip SaaS features.
```

---

### Task S.2 — Strip SaaS Layer, Configure Single-Tenant Mode

```
PROMPT TO ANTIGRAVITY:

Modify the backend to run in single-tenant mode for Lahana.
The goal: keep all hotel management features, remove all SaaS billing
and multi-tenant routing complexity.

BACKEND CHANGES:

1. config/settings/base.py:
   - Move apps.subscriptions OUT of SHARED_APPS — disable it entirely
     for DEPLOYMENT_MODE=single_tenant
   - Move apps.tenants to optional — in single-tenant mode, django-tenants
     middleware is bypassed; all DB queries use a single 'lahana' schema
   - Add: SINGLE_TENANT_SCHEMA = os.getenv('SINGLE_TENANT_SCHEMA', 'lahana')

2. config/settings/production.py — add:
   IS_SAAS = False
   SINGLE_TENANT_MODE = True

3. Create a lightweight SingleTenantMiddleware that replaces
   django-tenants' TenantMainMiddleware in single-tenant mode:
   - Always routes to the SINGLE_TENANT_SCHEMA schema
   - No subdomain parsing needed
   - Faster than full django-tenants routing

4. REMOVE from INSTALLED_APPS (single-tenant mode):
   - apps.subscriptions (no billing tiers needed)

5. KEEP all hotel apps exactly as-is:
   apps.accounts, apps.properties, apps.bookings, apps.frontdesk,
   apps.restaurant, apps.pos, apps.housekeeping, apps.billing,
   apps.payments, apps.staff, apps.hr, apps.payroll, apps.inventory,
   apps.crm, apps.loyalty, apps.analytics, apps.reports,
   apps.notifications

FRONTEND CHANGES:

6. middleware.ts — remove subdomain tenant detection logic.
   In single-tenant mode, the app always runs at the root domain,
   never at subdomains.

7. Remove these pages entirely (not needed for private install):
   - /superadmin/* (replace with a simpler /admin redirect to Django admin)
   - /(public)/landing/* (Lahana has their own website)
   - /(public)/register/* (no self-service signup)

8. Sidebar.tsx — remove SaaS navigation items:
   - Remove "Super Admin" menu section
   - Remove "Subscription" menu items
   - Keep all hotel management items unchanged

9. Add environment variable to frontend:
   NEXT_PUBLIC_DEPLOYMENT_MODE=single_tenant
   NEXT_PUBLIC_PROPERTY_NAME=Lahana Resort
   NEXT_PUBLIC_PROPERTY_LOGO_URL=/lahana-logo.png

Write no new tests for this task — it's deletion/configuration work.
After completing, verify: docker-compose up --build starts successfully
and the login page loads at localhost:3000.
```

---

## 4. Phase L1 — Lahana Branding & Configuration

### Task L1.1 — Visual Branding

```
PROMPT TO ANTIGRAVITY:

Apply Lahana Resort's branding throughout the entire frontend.

1. Replace all "SIA HMS" text references with "Lahana Resort PMS"
   Search for: "SIA HMS", "SIA Enterprises", "Hotel Management System"
   in frontend/src/ and replace with "Lahana Resort"

2. Color scheme — apply Lahana's brand colors throughout Tailwind config:
   (Fill in actual colors when available from client. Use these as defaults
   until client provides their brand guide:)
   - Primary: Forest green (#2D5016) — resort/nature feel
   - Accent: Warm gold (#C9A84C) — premium feel
   - Background: Warm white (#FAFAF7)
   Update tailwind.config.ts CSS variables accordingly.

3. Logo placement:
   - Add lahana-logo.png to frontend/public/
   - Replace SIA logo in Sidebar.tsx top section
   - Replace logo in login page (src/app/(auth)/login/page.tsx)
   - Replace logo on WeasyPrint PDF templates:
     backend/templates/pdf/invoice.html
     backend/templates/pdf/payslip.html

4. Login page (src/app/(auth)/login/page.tsx):
   - Change title to "Lahana Resort — Staff Portal"
   - Add tagline: "Powered by SIA Enterprises" (small, bottom of card)
   - Background: use a Lahana property photo or nature pattern

5. Browser tab title (layout.tsx):
   - <title>Lahana Resort PMS</title>
   - Favicon: use Lahana logo

6. PDF invoice header (backend/templates/pdf/invoice.html):
   - Hotel name: Lahana Resort
   - Add address, phone, email, PAN/VAT number placeholders
   - [Leave as {{property.name}}, {{property.address}} etc —
     pulled dynamically from Property model]
```

---

### Task L1.2 — Seed Lahana's Actual Data

```
PROMPT TO ANTIGRAVITY:

Create a Django management command that seeds Lahana Resort's real
property configuration. This replaces the generic demo data.

Create: backend/apps/properties/management/commands/seed_lahana.py

This command should create (using get_or_create — safe to run multiple times):

PROPERTY:
  name: "Lahana Resort"
  tagline: "Your Private Mountain Escape"
  address: "[To be filled by client]"
  city: "Kathmandu"  # Update when client provides
  country: "Nepal"
  currency: "NPR"
  timezone: "Asia/Kathmandu"
  check_in_time: "14:00"
  check_out_time: "12:00"
  vat_number: "[Client's VAT/PAN — to be filled]"

ROOM TYPES (create placeholders — update with real Lahana rooms):
  - "Standard Villa", base_price=8000, max_occupancy=2
  - "Deluxe Villa", base_price=12000, max_occupancy=3
  - "Family Suite", base_price=18000, max_occupancy=4
  - "Presidential Villa", base_price=30000, max_occupancy=4
  NOTE: Mark all as needs_review=True in notes field so staff
  know to update with actual rates

DINING AREAS:
  - "Main Restaurant" (indoor)
  - "Garden Terrace" (outdoor)
  - "Bar & Lounge"
  - "Room Service"

USER ROLES — create initial staff accounts:
  - admin@lahana.com / [prompt staff to change on first login] — SuperAdmin
  - reception@lahana.com — FrontDesk
  - kitchen@lahana.com — RestaurantStaff
  - housekeeping@lahana.com — Housekeeping

TAX CONFIG:
  - VAT: 13%
  - Service Charge: 10%
  (Standard Nepal hospitality rates)

Register this command to run automatically on first deploy:
  add to docker-compose.yml entrypoint after migrate

Run: python manage.py seed_lahana
Print confirmation of each item created.
```

---

## 5. Phase L2 — Website Booking Sync

### Task L2.1 — Understand Lahana's Current Website Setup

```
BEFORE CODING — answer these questions first (Sudip to ask client):

1. What platform is lahanaresort.com built on?
   - WordPress? Custom HTML? Wix? Squarespace? Next.js?
   This determines which sync method to use.

2. Do they currently have an online booking form on their website?
   - If yes: is it a third-party widget (Booking.com, Airbnb) or custom?
   - If no: this is simpler — we just embed our widget

3. Do they want guests to book directly on our system, or just have
   bookings from a third-party system flow in?

THEN proceed to either Task L2.2 or L2.3 based on answers.
```

---

### Task L2.2 — Option A: Embed Our Booking Widget (Recommended)

```
PROMPT TO ANTIGRAVITY:

This is the recommended approach if Lahana's website is WordPress or
a simple HTML/CMS site.

The public booking widget already exists at /book (Task 2.3 from original
HMS build). It is already designed as an embeddable iframe.

Deliverables:

1. Ensure the booking widget at /(public)/book/ is fully styled with
   Lahana branding (their logo, colors, font)

2. Generate an embed code snippet for Lahana's web developer to paste
   into their existing website:

   <iframe
     src="https://pms.lahanaresort.com/book"
     width="100%"
     height="700"
     frameborder="0"
     style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
   ></iframe>

3. Configure CORS in Django settings to allow requests from lahanaresort.com:
   CORS_ALLOWED_ORIGINS = ["https://lahanaresort.com", "https://www.lahanaresort.com"]

4. Add a "Book Now" button to the public widget that submits directly
   to POST /api/bookings/public/availability/ and POST /api/public/bookings/

5. On successful booking, send:
   - Confirmation SMS to guest via Sparrow SMS
   - Email confirmation via SMTP
   - The booking appears immediately in /bookings/calendar in the PMS

6. Guest receives a booking reference number they can use to check status

This requires ZERO changes to Lahana's existing website beyond pasting
one iframe tag. Their web developer can do this in 5 minutes.
```

---

### Task L2.3 — Option B: Webhook Intake (If They Use a Third-Party Booking System)

```
PROMPT TO ANTIGRAVITY:

Use this only if Lahana currently uses a third-party booking platform
(Booking.com, Agoda, or a third-party widget) and wants bookings from
there to auto-sync into the PMS.

Create a webhook intake endpoint:

1. POST /api/bookings/webhook/external/
   - Accepts JSON booking payload from any external source
   - Validates a shared secret (X-Webhook-Secret header)
   - Maps external booking fields to our Reservation model:
     guest_name, guest_email, guest_phone,
     check_in_date, check_out_date, adults, children,
     room_type_name, total_amount, external_reference_id
   - Creates GuestProfile (or finds existing by email/phone)
   - Creates Reservation with status=confirmed,
     booking_source=ota_booking (or specific source)
   - Stores external_reference_id for cross-reference
   - Returns 200 OK with our internal reservation_id

2. POST /api/bookings/webhook/cancellation/
   - Accepts external cancellation notification
   - Finds reservation by external_reference_id
   - Updates status=cancelled, logs reason

3. Dashboard notification: new bookings from webhook appear in
   /frontdesk and /bookings/calendar immediately (WebSocket push)

4. Document the webhook format clearly in a
   WEBHOOK_INTEGRATION.md file that Lahana can share with
   their booking platform or web developer.

Write tests for both happy path and malformed/unauthorized webhook calls.
```

---

## 6. Phase L3 — Waiter Mobile Ordering (PWA)

### Task L3.1 — Progressive Web App Setup

```
PROMPT TO ANTIGRAVITY:

Make the SIA HMS frontend installable as a PWA (Progressive Web App)
on Android and iOS devices. This makes it feel like a native app to
Lahana's staff — installs on home screen, has an app icon, launches
fullscreen — without going through any app store.

1. Create frontend/public/manifest.json:
{
  "name": "Lahana Resort PMS",
  "short_name": "Lahana PMS",
  "description": "Property Management System — Lahana Resort",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#FAFAF7",
  "theme_color": "#2D5016",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512",
      "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "POS Orders",
      "url": "/pos",
      "icons": [{ "src": "/icons/pos-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Front Desk",
      "url": "/frontdesk",
      "icons": [{ "src": "/icons/frontdesk-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Housekeeping",
      "url": "/housekeeping/my-tasks",
      "icons": [{ "src": "/icons/housekeeping-icon.png", "sizes": "96x96" }]
    }
  ]
}

2. Add <link rel="manifest"> to frontend/app/layout.tsx

3. Create a minimal service worker (frontend/public/sw.js):
   - Cache the app shell (login page, dashboard layout, POS page)
   - Cache strategy: Network First for API calls, Cache First for
     static assets (CSS, JS, images)
   - This gives faster loads and resilience when WiFi is spotty

4. Register the service worker in layout.tsx using next-pwa or
   manual registration in a useEffect

5. Add an "Install App" prompt component:
   - Appears on first visit from mobile browser
   - "Add Lahana PMS to your home screen for the best experience"
   - Dismiss option (stores dismissal in localStorage)

6. Generate placeholder PNG icons for now:
   - 192x192, 512x512, 512x512 maskable
   - Green background (#2D5016) with "L" monogram in gold
   - Replace with real Lahana logo icons when provided by client

Test on: Android Chrome, iOS Safari, Windows Chrome.
Verify "Add to Home Screen" prompt appears on each.
```

---

### Task L3.2 — Offline Order Entry for Waiters

```
PROMPT TO ANTIGRAVITY:

Lahana's WiFi may be unreliable in outdoor dining areas (Garden Terrace,
pool area). Waiters need to continue taking orders even when offline.

Implement offline-capable order entry using IndexedDB + service worker:

1. In frontend/src/lib/store/posStore.ts (already exists as Zustand store):
   - Add persistence to IndexedDB (use idb-keyval library)
   - Orders in progress survive page refresh or WiFi drop

2. Create a sync queue for offline orders:
   frontend/src/lib/offlineQueue.ts:
   - When waiter submits an order: if navigator.onLine → POST immediately
   - If offline → save to IndexedDB queue with status='pending_sync'
   - Listen for window 'online' event → auto-sync all queued orders
   - Show a "Syncing X orders..." banner when coming back online

3. Offline-available data (cached in service worker):
   - Menu items (categories + items with prices)
   - Table list + current status
   - Active orders for the current shift
   Cache these on app load, refresh every 5 minutes when online

4. UI indicators:
   - Offline banner: amber bar at top — "Offline — orders will sync
     when connection is restored"
   - Online indicator restored: green flash "Back online — X orders synced"
   - Each order card shows sync status: ✓ Synced / ⏳ Pending Sync

5. Conflict handling:
   - If an order was submitted offline and the table was closed online
     in the meantime, flag it for manager review rather than
     auto-creating a duplicate

This does NOT require the entire app to work offline — only the
POS order entry flow (/pos and /pos/tables). All other pages
degrade gracefully (show "No connection" message).
```

---

### Task L3.3 — QR Code Per Table (Waiter Shortcut)

```
PROMPT TO ANTIGRAVITY:

Instead of a waiter navigating through the app to find a table,
they scan a QR code stuck to the table and land directly on
that table's order screen.

1. In apps/restaurant/models.py — DiningTable already has a qr_code field.
   If not populated, auto-generate UUIDs for all tables on migration.

2. Add API endpoint:
   GET /api/restaurant/tables/qr/{qr_uuid}/
   - Public endpoint (no auth required to resolve the QR)
   - Returns: {table_id, table_number, area_name}
   - Waiter is then prompted to log in (if not already) and
     lands on /pos?table={table_id}

3. QR Code generation page in the admin:
   /admin/restaurant/tables/qr-print/
   - Renders all tables as a printable page
   - Each table: QR code image + table number + area name
   - Format: Card size (85x54mm) suitable for printing and laminating
   - Generate QR image using Python qrcode library (server-side)
   - URL encoded in QR: https://pms.lahanaresort.com/scan/{qr_uuid}

4. Frontend route:
   /scan/[qr_uuid]/page.tsx
   - Resolves the UUID via API
   - If logged in: redirect to /pos?table={table_id}
   - If not logged in: redirect to /login?redirect=/pos?table={table_id}
   - After login, waiter lands directly on that table's order screen

5. In /pos page — if ?table= param is present:
   - Auto-select that table
   - Skip the table selection step entirely
   - Show "Table 4 — Garden Terrace" in the order header

pip install qrcode[pil] — add to requirements/base.txt
Write test confirming QR UUID resolves to correct table data.
```

---

### Task L3.4 — Guest-Facing Digital Menu (QR Menu)

```
PROMPT TO ANTIGRAVITY:

Guests at their table scan a QR code and see the menu on their own
phone — no physical menu card needed. This is read-only for guests;
they cannot order through it (waiters still take orders).

1. Create a public (no auth) menu page:
   frontend/src/app/(public)/menu/[table_uuid]/page.tsx

   - Fetches menu via GET /api/restaurant/public/menu/
   - Shows categories as horizontal tabs (Starters, Mains, Desserts, Drinks)
   - Each item: photo, name, description, price in NPR
   - Vegetarian/vegan badges
   - "Unavailable" items shown greyed out (real-time from MenuItem.is_available)
   - Language toggle: English / नेपाली (uses i18n already built)

2. Design requirements (use global frontend-design skill):
   - Mobile-first (guests use their own phones)
   - Fast loading (compress images, lazy load)
   - Premium feel — matches Lahana's brand colors
   - Large readable font — works in outdoor/dim lighting

3. API endpoint (public, no auth):
   GET /api/restaurant/public/menu/
   Returns active categories + available menu items only
   Cache-Control: max-age=300 (5 min cache — menu doesn't change often)

4. QR codes for guest menu:
   - Different QR from the waiter QR
   - Encodes: https://pms.lahanaresort.com/menu/{table_uuid}
   - Same printable QR sheet from Task L3.3 — add a second QR per
     table card (Waiter QR + Guest Menu QR)
   - Label clearly: "Scan to view menu" vs "Staff order QR"

5. Optional: "Call Waiter" button at bottom of menu page
   - Sends a WebSocket notification to /pos dashboard
   - Shows as a card: "Table 4 is calling a waiter"
   - No order tracking — just an attention signal
```

---

## 7. Phase L4 — Lahana-Specific Features

### Task L4.1 — Daily Operations Dashboard for Manager

```
PROMPT TO ANTIGRAVITY:

The main dashboard (/dashboard/page.tsx) currently shows generic stats.
Customize it for Lahana Resort's specific daily management needs.

Replace the generic dashboard with a Lahana Daily Operations view:

SECTION 1 — Today at a Glance (top row of stat cards):
  - Today's occupancy: X/Y rooms occupied + % bar
  - Expected arrivals today: count + list preview
  - Expected departures today: count + list preview
  - Restaurant covers today: lunch + dinner count
  - Today's revenue so far: NPR amount

SECTION 2 — Live Room Status (below stats):
  - Grid of all Lahana villas/rooms
  - Color: Green=Available, Red=Occupied, Amber=Dirty, Grey=Maintenance
  - Click any room → opens room detail sheet

SECTION 3 — Today's Arrivals (left column):
  - Compact list of arriving guests
  - Name, room type, expected check-in time, booking source
  - "Check In" quick action button

SECTION 4 — Restaurant Activity (right column):
  - Open tables count vs total
  - Active orders count
  - Quick link to POS

SECTION 5 — Alerts (bottom, only shown if any):
  - Low stock items (from inventory)
  - Overdue housekeeping tasks
  - Pending maintenance requests

This dashboard should be the FIRST thing a manager sees each morning
and give them a complete picture of the day without navigating anywhere.
All data fetched from existing APIs — no new backend work needed.
Use Recharts for the small occupancy trend sparkline (last 7 days).
```

---

### Task L4.2 — Bill Splitting for Groups

```
PROMPT TO ANTIGRAVITY:

Lahana hosts group bookings (families, corporate retreats). They need
to split bills between multiple guests or payment methods.

Extend the checkout flow in CheckOutModal.tsx and billing/views.py:

1. BACKEND — apps/billing/views.py:
   Add POST /api/billing/invoices/{id}/split/
   Body: { splits: [{description, amount, payment_method}] }
   - Validates that splits sum to invoice.total_amount
   - Creates a SplitPayment record for each split
   - Marks invoice as paid when all splits are recorded

   New model: SplitPayment
     invoice (FK), description (e.g., "Room 1 — John"),
     amount, payment_method, paid_at, reference

2. FRONTEND — CheckOutModal.tsx:
   Add "Split Bill" toggle after the total is shown
   When toggled:
   - Show "+ Add Split" button
   - Each split row: description input, amount input, payment method select
   - Running total shows: "Allocated: NPR X / NPR Y remaining"
   - Validation: cannot confirm until all amount is allocated
   - Submit: POST to split endpoint above

3. PDF invoice with splits:
   - Add a "Bill Split Summary" section at the bottom of invoice.html
   - Lists each split: who paid, how much, by what method

Write tests for: valid split, amounts not summing to total (should reject),
split with mixed cash/eSewa.
```

---

### Task L4.3 — Advance Deposit & Cancellation Policy

```
PROMPT TO ANTIGRAVITY:

Lahana takes advance deposits for bookings and has a cancellation policy
(e.g., 50% refund if cancelled 7+ days before, no refund within 7 days).

1. BACKEND:
   Property model — add cancellation policy fields:
     free_cancellation_days: int (default 7)
     cancellation_refund_percent: int (default 50)
     advance_deposit_percent: int (default 30)

   When booking is created with deposit:
     - Invoice created for deposit amount only (30% of total)
     - Remaining balance flagged on reservation

   When booking is cancelled:
     - Calculate days until check-in
     - Apply refund policy automatically
     - Generate refund invoice or credit note
     - Send SMS to guest: "Your booking [ref] has been cancelled.
       Refund of NPR [amount] will be processed within 3-5 working days."

2. FRONTEND:
   - /bookings/new Step 3 — show deposit amount clearly:
     "NPR X deposit required now. Remaining NPR Y due at check-in."
   - /bookings/[id] — show cancellation policy and calculate
     refund amount dynamically based on today's date

3. Public booking widget (/book):
   - Display cancellation policy before guest confirms
   - Show deposit amount and full amount separately

Write tests for: cancellation 10 days out (gets refund),
cancellation 3 days out (no refund), cancellation same day.
```

---

### Task L4.4 — Housekeeping Schedule Automation

```
PROMPT TO ANTIGRAVITY:

Automate Lahana's daily housekeeping schedule instead of manual assignment.

1. BACKEND — apps/housekeeping/tasks.py:
   Add Celery task: generate_morning_housekeeping_schedule
   Runs at 7:00 AM Nepal time (Asia/Kathmandu) daily

   Logic:
   a. Find all rooms with status='dirty' or 'checkout_today'
   b. Find active housekeeping staff (clocked in or on shift)
   c. Distribute rooms among available staff:
      - By floor (each staff assigned one floor where possible)
      - Priority: checkouts first (guest may be arriving same day)
      - Override: maintenance rooms go to a separate maintenance queue
   d. Create HousekeepingTask for each room+staff assignment
   e. Send SMS to each housekeeping staff member:
      "Good morning! Your rooms for today:
       Room 101, 103, 105 (Floor 1) — 3 rooms.
       Priority: Room 103 (checkout by 12pm).
       Log in to Lahana PMS for details."

2. FRONTEND — /housekeeping page:
   - "Auto-Generate Schedule" button (for manager to trigger manually too)
   - Shows today's assignment grid: staff member vs room vs status
   - Color: green=done, amber=in_progress, red=overdue, grey=pending

3. Staff mobile view (/housekeeping/my-tasks):
   - Shows ONLY this staff member's assigned rooms for today
   - Sorted by priority
   - "Start", "Done", "Report Issue" buttons (already exists — verify it
     shows today's auto-assigned tasks correctly)
```

---

## 8. Phase L5 — Deployment on Lahana's Server

### Task L5.1 — Production Server Setup

```
PROMPT TO ANTIGRAVITY:

Generate complete server setup documentation and scripts for deploying
the Lahana Resort PMS on a production VPS.

RECOMMENDED SERVER SPECS FOR LAHANA:
  Provider: Hetzner (best value) or DigitalOcean (easier management)
  Size: CX32 (4 vCPU, 8GB RAM, 80GB NVMe) — ~$10-15 USD/month
  OS: Ubuntu 22.04 LTS
  Location: Closest to Nepal — Singapore or Mumbai (Hetzner: Singapore,
  DigitalOcean: Bangalore)
  Domain: pms.lahanaresort.com (Lahana points their DNS A record here)

Generate: scripts/server_setup.sh
This script, run on a fresh Ubuntu 22.04 VPS, should:

1. System setup:
   apt update && upgrade
   Install: docker, docker-compose, nginx, certbot, fail2ban, ufw, git

2. Security hardening:
   - UFW: allow only 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - SSH: disable password auth, key-only
   - Fail2ban: protect SSH and nginx login endpoint
   - Rate limiting on /api/auth/login/ at nginx level

3. SSL:
   certbot certonly --nginx -d pms.lahanaresort.com
   Auto-renewal: cron 0 12 * * * certbot renew --quiet

4. Nginx config (nginx/nginx.conf) — update for Lahana:
   server_name pms.lahanaresort.com;
   proxy_pass for /api/ → backend:8000
   proxy_pass for / → frontend:3000
   WebSocket upgrade for /ws/ paths

5. Deployment flow:
   git clone https://github.com/sudip-parajuli/lahana-resort-hms
   cp .env.example .env
   [Fill in .env with Lahana's real values]
   docker-compose -f docker-compose.prod.yml up --build -d
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py seed_lahana

6. Backup setup (CRITICAL for client's data):
   Daily cron at 3 AM Nepal time:
   - pg_dump → /backups/lahana_$(date +%Y%m%d).sql
   - Compress with gzip
   - Keep last 30 days locally
   - Optional: rsync to a second location (Lahana's office PC or
     a second cheap VPS for offsite backup)
   Script: scripts/backup.sh

7. Monitoring:
   - Install Netdata for server metrics (CPU, RAM, disk, network)
   - Alert via email if disk > 80% or service goes down
   - Simple uptime check: UptimeRobot free tier on pms.lahanaresort.com
```

---

### Task L5.2 — Production .env Configuration

```
PROMPT TO ANTIGRAVITY:

Generate a complete .env template specifically for the Lahana production
deployment. This is a reference — Sudip fills in real values before deploy.

Create: .env.lahana.example

# ── DEPLOYMENT MODE ──────────────────────────────────────────
DEPLOYMENT_MODE=single_tenant
SINGLE_TENANT_SCHEMA=lahana
IS_SAAS=false

# ── DJANGO ───────────────────────────────────────────────────
DJANGO_SECRET_KEY=[generate with: python -c "import secrets; print(secrets.token_urlsafe(50))"]
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=pms.lahanaresort.com,www.pms.lahanaresort.com

# ── DATABASE ─────────────────────────────────────────────────
POSTGRES_DB=lahana_pms
POSTGRES_USER=lahana_user
POSTGRES_PASSWORD=[strong random password]
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ── REDIS ────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0

# ── MINIO STORAGE ────────────────────────────────────────────
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=[generate]
MINIO_SECRET_KEY=[generate]
MINIO_BUCKET_GUEST_DOCS=lahana-guest-docs
MINIO_BUCKET_MEDIA=lahana-media

# ── SMTP EMAIL ───────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com  # Or Lahana's own SMTP
EMAIL_PORT=587
EMAIL_HOST_USER=[lahana email]
EMAIL_HOST_PASSWORD=[app password]
DEFAULT_FROM_EMAIL=pms@lahanaresort.com

# ── SPARROW SMS ──────────────────────────────────────────────
SPARROW_SMS_TOKEN=[Lahana's Sparrow SMS token]
SPARROW_SMS_FROM=LahanaRes

# ── PAYMENT GATEWAYS ─────────────────────────────────────────
ESEWA_SECRET_KEY=[Lahana's eSewa merchant secret]
ESEWA_MERCHANT_CODE=[Lahana's eSewa merchant code]
ESEWA_SANDBOX=False

KHALTI_SECRET_KEY=[Lahana's Khalti secret key]
KHALTI_SANDBOX=False

FONEPAY_MERCHANT_CODE=[Lahana's Fonepay merchant code]
FONEPAY_SANDBOX=False

# ── PROPERTY ─────────────────────────────────────────────────
PROPERTY_NAME=Lahana Resort
PROPERTY_DOMAIN=pms.lahanaresort.com
PROPERTY_WEBSITE=https://lahanaresort.com
CORS_ALLOWED_ORIGINS=https://lahanaresort.com,https://www.lahanaresort.com

# ── WEBHOOK ──────────────────────────────────────────────────
EXTERNAL_BOOKING_WEBHOOK_SECRET=[generate — share with Lahana's web dev]

# ── NEXT.JS ──────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://pms.lahanaresort.com
NEXT_PUBLIC_DEPLOYMENT_MODE=single_tenant
NEXT_PUBLIC_PROPERTY_NAME=Lahana Resort

Add documentation comment on every variable explaining what to get/find.
```

---

### Task L5.3 — GitHub Actions for Lahana

```
PROMPT TO ANTIGRAVITY:

Update .github/workflows/deploy.yml for the Lahana private repo.
This should deploy to Lahana's VPS on every push to main.

Jobs:
1. test:
   - Run pytest (backend tests)
   - Run tsc --noEmit (frontend type check)
   - Fail deployment if either fails

2. deploy (only if test passes, only on push to main):
   - SSH into Lahana's VPS
   - git pull origin main
   - docker-compose -f docker-compose.prod.yml up --build -d backend frontend celery_worker celery_beat
   - docker-compose exec backend python manage.py migrate --no-input
   - docker-compose exec backend python manage.py collectstatic --no-input
   - docker-compose restart nginx
   - Send Sparrow SMS to Sudip: "Lahana PMS deployed ✅ $(date)"

Required GitHub Secrets (document these for Sudip to add):
   LAHANA_VPS_HOST, LAHANA_VPS_USER, LAHANA_VPS_SSH_KEY
   SPARROW_SMS_TOKEN, SUDIP_PHONE
```

---

## 9. Phase L6 — Staff Training & Handover

### Task L6.1 — Generate Staff Training Materials

```
PROMPT TO ANTIGRAVITY:

Generate training documentation for Lahana Resort staff using the
global docx skill and pdf skill.

Create 4 separate guides — each focused on one role:

1. FRONT DESK GUIDE (English + Nepali sections):
   File: docs/FrontDesk_Guide.md → export as PDF
   Cover:
   - Login and daily startup
   - Today's dashboard — what each section means
   - Checking in a guest (step by step with screenshots placeholder)
   - Checking out a guest
   - Walk-in guest booking
   - Handling online booking sync issues
   - Generating and printing a bill

2. WAITER / RESTAURANT GUIDE:
   File: docs/Waiter_Guide.md → export as PDF
   Cover:
   - Installing the app on your phone (PWA)
   - Scanning a table QR code
   - Taking an order
   - Modifying an order
   - What to do when internet is down (offline mode)
   - Charging order to a room vs table payment
   - Calling for KDS confirmation

3. HOUSEKEEPING GUIDE:
   File: docs/Housekeeping_Guide.md → export as PDF
   Cover:
   - Opening housekeeping tasks on phone
   - Starting and completing a room
   - Reporting a maintenance issue
   - Understanding room priority (checkout rooms first)

4. MANAGER / ADMIN GUIDE:
   File: docs/Manager_Guide.md → export as PDF
   Cover:
   - Daily dashboard overview
   - Managing bookings and availability
   - Running payroll
   - Generating financial reports
   - Adding/removing staff
   - Changing menu items and prices
   - Backing up data

Use the global pdf skill (WeasyPrint) to generate printable PDF versions.
Keep language simple — assume staff may not be tech-savvy.
Include step numbers and clear action verbs.
Add a "When something goes wrong" section in each guide with
Sudip's WhatsApp number for support.
```

---

### Task L6.2 — Pre-Launch Checklist

```
Create file: LAHANA_LAUNCH_CHECKLIST.md

## 🚀 Lahana Resort PMS — Go-Live Checklist

### 1 Week Before Launch
- [ ] Server purchased and SSH access confirmed
- [ ] Domain pms.lahanaresort.com pointed to server IP
- [ ] SSL certificate issued (certbot)
- [ ] All Docker services running: docker-compose ps (all healthy)
- [ ] seed_lahana command run — property, rooms, staff accounts created
- [ ] Real room rates and names updated in /rooms/types
- [ ] Staff accounts tested — each role can log in
- [ ] Payment sandbox: eSewa, Khalti test transaction completed
- [ ] SMS: test booking confirmation SMS received
- [ ] Email: test booking confirmation email received
- [ ] Website iframe: booking widget embedded on lahanaresort.com and tested
- [ ] QR codes printed and laminated for all tables
- [ ] PDF invoice generated with Lahana letterhead and VAT number
- [ ] Nepali language toggle verified working

### 1 Day Before Launch
- [ ] Payment gateways switched from sandbox → production (ESEWA_SANDBOX=False)
- [ ] Final test booking made on public widget — payment processed
- [ ] Backup script tested: pg_dump runs, file exists in /backups/
- [ ] GitHub Actions deployment pipeline tested (push to main → auto-deploy)
- [ ] Netdata / UptimeRobot monitoring confirmed active
- [ ] All staff trained (Front Desk, Waiter, Housekeeping sessions done)
- [ ] Paper guide printed and distributed to each department

### Launch Day
- [ ] Migration: import any existing bookings manually (if Lahana has paper records)
- [ ] Confirm manager knows how to run daily backup manually if needed
- [ ] Sudip on standby (WhatsApp) for first 48 hours
- [ ] Monitor server metrics via Netdata for first hour of real usage

### 1 Week After Launch
- [ ] Review any error logs from production
- [ ] Collect feedback from Front Desk and kitchen staff
- [ ] Check backup files exist for last 7 days
- [ ] Invoice: generate first week's AMC invoice for Lahana
```

---

## 10. Handoff Prompt

Use this when switching from Antigravity to KiloCode or OpenCode:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI HANDOFF — Lahana Resort PMS
Private Install based on SIA HMS SaaS codebase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT PROGRESS:
→ [e.g. "Task L2.2 complete. Starting Task L3.1 (PWA setup)."]

LAST FILE WORKED ON:
→ [e.g. "frontend/public/manifest.json"]

NEXT TASK:
→ [paste the exact task block from this plan]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT:
- Source repo: github.com/sudip-parajuli/HotelManagementSaaS
- Lahana repo: github.com/sudip-parajuli/lahana-resort-hms
- This is a SINGLE-TENANT private install — not SaaS
- DEPLOYMENT_MODE=single_tenant (django-tenants bypassed)
- All 10 HMS modules already exist — we are NOT rebuilding, only
  adapting, branding, and adding Lahana-specific features

TECH STACK (unchanged from SIA HMS):
- Django 5 + DRF + Channels + Celery
- Next.js 14 App Router + TypeScript + shadcn/ui + Tailwind
- PostgreSQL 16, Redis 7, MinIO
- eSewa + Khalti + Fonepay (Nepal payments)
- Sparrow SMS, WeasyPrint PDF, openpyxl Excel
- Docker + Nginx + GitHub Actions

CODING STANDARDS (same as original plan):
- Django ORM only, never raw SQL
- TypeScript strict mode, no 'any'
- shadcn/ui for all UI components
- Tests required for new backend logic
- httpOnly cookies for JWT, never localStorage

GLOBAL SKILLS AVAILABLE:
- frontend-design, pdf, xlsx, docx, pptx, file-reading

Please ask for any files you need before continuing.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 11. Master Checklist

| Phase | Task | Est. Hours | Priority | Status |
|---|---|---|---|---|
| Setup | S.1 Clone & create lahana repo | 1 | 🔴 First | ⬜ |
| Setup | S.2 Strip SaaS layer, single-tenant mode | 6–8 | 🔴 First | ⬜ |
| L1 | L1.1 Visual branding | 4–6 | 🔴 High | ⬜ |
| L1 | L1.2 Seed Lahana data | 3–4 | 🔴 High | ⬜ |
| L2 | L2.1 Understand website setup (client call) | 1 | 🔴 High | ⬜ |
| L2 | L2.2 Embed booking widget (Option A) | 3–4 | 🔴 High | ⬜ |
| L2 | L2.3 Webhook intake (Option B, if needed) | 5–6 | 🟡 If needed | ⬜ |
| L3 | L3.1 PWA manifest + install prompt | 4–5 | 🔴 High | ⬜ |
| L3 | L3.2 Offline order entry for waiters | 8–10 | 🟡 Important | ⬜ |
| L3 | L3.3 QR code per table | 4–5 | 🔴 High | ⬜ |
| L3 | L3.4 Guest-facing digital menu | 6–8 | 🟡 Important | ⬜ |
| L4 | L4.1 Daily ops dashboard for manager | 5–6 | 🟡 Important | ⬜ |
| L4 | L4.2 Bill splitting for groups | 5–6 | 🟡 Important | ⬜ |
| L4 | L4.3 Advance deposit & cancellation policy | 6–8 | 🟡 Important | ⬜ |
| L4 | L4.4 Housekeeping schedule automation | 4–5 | 🟡 Important | ⬜ |
| L5 | L5.1 Server setup script | 4–5 | 🔴 High | ⬜ |
| L5 | L5.2 Production .env config | 2 | 🔴 High | ⬜ |
| L5 | L5.3 GitHub Actions for Lahana | 2–3 | 🔴 High | ⬜ |
| L6 | L6.1 Staff training materials | 6–8 | 🟡 Important | ⬜ |
| L6 | L6.2 Pre-launch checklist | 1 | 🔴 High | ⬜ |

**Total estimated effort: ~81–104 hours (solo, with AI assistance)**

### One Question Before Starting (Critical)

**Ask Lahana before writing a single line of code:**
"What platform is your current website built on, and do guests currently
book through your website?" — this determines Task L2.2 vs L2.3, which
affects the website sync architecture.

---

*SIA Enterprises — Strategy · Innovation · Analytics*
*siaenterprises.com.np · contact@siaenterprises.com.np · Kathmandu, Nepal*
