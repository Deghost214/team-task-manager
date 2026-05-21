# Team Task Manager (Executive Admin Panel)

A responsive, secure, full-stack collaborative project and task management web application built on Node.js, Express, React, and Tailwind CSS. The system enforces strict role-based access control (RBAC), manages active user-workforce relations, and generates real-time workload stats and overdue trackers.

---

## Technical Architecture

### 📊 Backend Ecosystem (Node.js + Express + Custom Database)
- **RESTful Endpoints & Middleware**: Enforces JWT/HMAC sessions via authorization request headers.
- **Relational Integrity Mapping**: Powered by `/server-db.ts` executing relational checks on `users`, `projects`, `projectMembers` and `tasks` with atomic file-backed writes.
- **Encrypted Signatures**: Uses native node PBKDF2 cryptography to generate salts and passwords securely.

### 🎨 Frontend Canvas (React + Tailwind CSS)
- **Fluid Visual Design**: Clean display typography styled meticulously with off-white backgrounds (`bg-slate-50`), bold charcoal accents, and responsive tactile transitions.
- **Custom Aesthetic Analytics Visuals**: Injected dynamic SVG circular rings, priority gauge percentages, and collaborative workload meters. No generic template dependencies.
- **Interactive Multi-Views**: Allows dynamic navigation across:
  - **Analytics Dashboard**: Aggregated high-level stats, overdue warnings, and user-percentage balances.
  - **Collaborators Directory**: Add, analyze, or disengage workspace associates.
  - **Timeline Board**: Toggle instantly between interactive **Kanban Lanes** (supporting arrow transition controls) and classic **Spreadsheet Lists**.

---

## Dynamic Sandbox Credentials

To assist prompt testing, we have pre-configured quick-login accounts in the developer panel:

| Name | Role | Email | Password |
|---|---|---|---|
| **Sarah Jenkins** | Admin / Creator | `admin@team.com` | `admin123` |
| **Jane Miller** | Project Member | `jane@team.com` | `member123` |

---

## Installation & Local Execution

Prerequisites: `Node.js v18+` & `npm`

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Execute Development Server**:
   ```bash
   npm run dev
   ```
3. **Optimized Production Packaging**:
   ```bash
   npm run build
   ```
4. **Initiate Production Instance**:
   ```bash
   npm run start
   ```
