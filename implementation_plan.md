# MNH – Autonomous AI Hospital Operating System

A production-ready, full-stack hospital management platform with AI-driven automation, multi-agent decision-making, and Azure cloud integration.

## Proposed Changes

### Project Structure

```
c:\Users\Ganji Rohith\Desktop\Hanuman\
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── config.py               # Configuration (Azure SQL, keys)
│   ├── requirements.txt
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py, patient.py, appointment.py
│   │   ├── staff.py, bed.py, equipment.py
│   │   ├── medicine.py, billing.py, payment.py
│   │   └── finance.py
│   ├── routes/                 # Flask Blueprints
│   │   ├── auth.py, patients.py, appointments.py
│   │   ├── hospital.py, billing.py, payments.py
│   │   ├── finance.py, predictions.py, agents.py
│   │   └── dashboard.py
│   ├── services/               # Business logic
│   │   ├── billing_service.py, prediction_service.py
│   │   └── agent_service.py
│   ├── agents/                 # Multi-agent system
│   │   ├── medical_agent.py, operations_agent.py
│   │   ├── finance_agent.py, ceo_agent.py
│   │   └── orchestrator.py
│   └── scripts/
│       ├── init_db.py          # DB schema creation & seeding
│       └── azure_setup.sh      # Azure resource setup
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── public/index.html
│   └── src/
│       ├── App.jsx, index.js, index.css
│       ├── components/         # Reusable UI components
│       │   ├── Sidebar.jsx, TopBar.jsx, StatsCard.jsx
│       │   ├── ChartCard.jsx, AlertCard.jsx, Modal.jsx
│       │   └── DataTable.jsx
│       ├── pages/
│       │   ├── Login.jsx, Register.jsx
│       │   ├── PatientDashboard.jsx, AdminDashboard.jsx
│       │   ├── Appointments.jsx, PatientProfile.jsx
│       │   ├── HospitalOps.jsx, MedicalStore.jsx
│       │   ├── Billing.jsx, Payments.jsx
│       │   ├── Finance.jsx, Predictions.jsx
│       │   └── AgentActivity.jsx
│       ├── context/AuthContext.jsx
│       └── services/api.js
└── azure/
    ├── deploy.sh
    ├── infra-setup.sh
    └── daily-reset.sh
```

---

### Backend (Flask)

#### [NEW] [app.py](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/backend/app.py)
Flask application factory with CORS, Blueprint registration, and error handling.

#### [NEW] [config.py](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/backend/config.py)
Configuration class using environment variables for Azure SQL connection string, Azure OpenAI keys, and secret key. Falls back to SQLite for local dev.

#### [NEW] models/ directory
SQLAlchemy ORM models:
- **User**: id, email, password_hash, name, role (patient/admin/doctor)
- **Patient**: profile fields (age, gender, bmi, conditions, lifestyle, blood_group)
- **Appointment**: patient_id, doctor_name, department, date, status
- **Staff**: name, role, department, shift, status
- **Bed**: ward, bed_number, status (available/occupied/maintenance), patient_id
- **Equipment**: name, department, status, last_maintenance
- **Medicine**: name, category, stock, expiry_date, price, supplier
- **Billing**: patient_id, items (JSON), total, status, created_at
- **Payment**: billing_id, method (upi/card/cash), amount, status, transaction_id
- **FinanceRecord**: type (revenue/expense), category, amount, department, date

#### [NEW] routes/ directory
Flask Blueprints with REST APIs:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/switch-role`
- `GET/PUT /api/patients/profile`, `GET/POST /api/appointments`
- `GET/POST /api/staff`, `GET/PUT /api/beds`, `GET /api/equipment`
- `GET/POST /api/medicines`, `GET /api/medicines/expiring`
- `POST /api/billing/generate`, `GET /api/billing/:id`
- `POST /api/payments/process`, `GET /api/payments/:id`
- `GET /api/finance/summary`, `GET /api/finance/department-analytics`
- `GET /api/predictions/patient-inflow`, `GET /api/predictions/revenue`
- `POST /api/agents/trigger`, `GET /api/agents/activity`
- `GET /api/dashboard/stats`

#### [NEW] services/ directory
Business logic layer:
- **billing_service.py**: Auto-generates itemized bills from consultation, tests, bed usage, medicines
- **prediction_service.py**: Mock ML predictions for inflow, revenue, disease trends, resource demand
- **agent_service.py**: Multi-agent orchestrator simulating Medical, Operations, Finance, CEO agents

#### [NEW] agents/ directory
Multi-agent system using a state-machine pattern:
- Each agent analyzes relevant data and produces recommendations
- Orchestrator chains agent calls: Medical → Operations → Finance → CEO
- CEO agent makes final approval decisions
- Activity log records all agent actions

#### [NEW] [init_db.py](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/backend/scripts/init_db.py)
Creates all tables and seeds with realistic sample data (patients, staff, beds, medicines, appointments, billing records, finance entries).

---

### Frontend (React + Tailwind CSS)

#### Design System
- **Color palette**: White background, soft blue (#3B82F6), purple (#8B5CF6), teal accents, subtle grays
- **Typography**: Inter font from Google Fonts
- **Cards**: Rounded (xl), soft shadows, white backgrounds
- **Charts**: Recharts library for clean, animated visualizations
- **Icons**: Lucide React icon set
- **Animations**: Subtle fade-in, slide-up transitions

#### [NEW] Core Components
- **Sidebar.jsx**: Collapsible navigation with icons, role-based menu items
- **TopBar.jsx**: User avatar, notifications bell, role badge
- **StatsCard.jsx**: Animated stat cards with icon, value, label, trend indicator
- **ChartCard.jsx**: Wrapper for Recharts with title and description
- **DataTable.jsx**: Sortable, filterable table component
- **AlertCard.jsx**: Color-coded alert cards for notifications
- **Modal.jsx**: Reusable modal with overlay

#### [NEW] Pages
- **Login/Register**: Clean centered forms with hospital branding
- **PatientDashboard**: Profile summary, upcoming appointments, recent bills, health alerts
- **AdminDashboard**: Revenue charts, patient trend lines, bed occupancy donut, alert feed, AI predictions
- **Appointments**: Calendar view, booking form, status tracking
- **HospitalOps**: Staff roster table, bed map grid, equipment status
- **MedicalStore**: Medicine inventory table, expiry alerts, stock levels
- **Billing**: Bill generator, itemized view, status badges
- **Payments**: Payment form with UPI/Card/Cash selection, receipt view
- **Finance**: Revenue vs expense charts, department breakdown, profit trends
- **Predictions**: AI prediction cards (inflow, revenue, disease, resource)
- **AgentActivity**: Real-time agent action feed with timeline view

#### [NEW] Auth & API
- **AuthContext.jsx**: React Context for auth state, token management, role switching
- **api.js**: Axios instance with base URL config, auth interceptor, all API methods

---

### Azure Integration

#### [NEW] [infra-setup.sh](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/azure/infra-setup.sh)
Azure CLI script to provision: Resource Group, SQL Server + DB, App Service Plan + Web App, Storage Account. Configurable via environment variables.

#### [NEW] [daily-reset.sh](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/azure/daily-reset.sh)
Script to tear down and recreate Azure resources for daily reset. Re-initializes database schema and seeds data.

#### [NEW] [deploy.sh](file:///c:/Users/Ganji%20Rohith/Desktop/Hanuman/azure/deploy.sh)
Deployment script: builds frontend, packages backend, deploys to Azure App Service via ZIP deploy.

---

## Verification Plan

### Automated Tests
1. **Backend API testing**: Start Flask server with `cd backend && pip install -r requirements.txt && python app.py`, then test endpoints using the browser or curl:
   - `POST /api/auth/register` with JSON body
   - `POST /api/auth/login` → get token
   - `GET /api/dashboard/stats` with auth header
   - `POST /api/billing/generate` → verify itemized bill

2. **Frontend build verification**: `cd frontend && npm install && npm run build` — verify no build errors

### Browser Testing
1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd frontend && npm start`
3. Open `http://localhost:3000` in browser
4. Verify: Login page renders → Register a user → Login → Dashboard loads with charts → Navigate through sidebar modules → Test billing flow → Test payment simulation

### Manual Verification
- **Visual check**: Verify the UI matches premium hospital design (card-based, soft colors, clean spacing)
- **Role switching**: Login as patient → switch to admin → verify different dashboard views
- **Billing flow**: Create appointment → Generate bill → Process payment → Verify finance update
- **Agent system**: Trigger agent workflow → Verify cascading agent decisions in activity feed


This is a premium hospital management system with AI-powered features. The UI should reflect this with a modern, clean design and smooth animations. The system should be easy to use for all roles (patient, admin, doctor) and should provide valuable insights to help manage the hospital more effectively.