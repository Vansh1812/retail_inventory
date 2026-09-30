# Enterprise Retail Inventory Management System (Modular Monolith)

A web-based Retail Inventory Management System designed to handle multi-location stock, fulfillment, and procurement with strict transactional consistency ($\text{Available} = \text{Total} - \text{Reserved}$).

---

## Tech Stack
- **Backend**: Java 17/21, Spring Boot 3.3, Spring Data JPA, Hibernate, PostgreSQL 16 (HikariCP), Maven.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Infrastructure**: Docker & Docker Compose (PostgreSQL 16 container).

---

## Project Structure
```
U:\hcl project\
├── docker-compose.yml              # Local PostgreSQL 16 setup
├── backend\                        # Spring Boot 3.3 modular monolith backend
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src\main\java\com\retail\inventory\
│       ├── common\                 # BaseEntity, ApiResponse<T>, GlobalExceptionHandler
│       └── health\                 # HealthCheckController (/api/v1/health)
└── frontend\                       # React 19 + TypeScript + Vite + Tailwind CSS
    ├── package.json
    ├── vite.config.ts              # API proxy (/api -> http://localhost:8080/api/v1)
    └── src\
        ├── api\axios.ts            # Configured Axios client with interceptors
        ├── components\             # Sidebar, TopNavbar, Breadcrumbs, AppLayout
        └── pages\                  # HealthTestScreen (live diagnostics & exception tester)
```

---

## How to Run

### 1. Start PostgreSQL (Docker)
From project root:
```bash
docker compose up -d
```

### 2. Run Backend (Spring Boot)
From `backend/`:
```bash
# In Windows cmd/powershell:
mvnw.cmd spring-boot:run

# Or in WSL/Linux:
./mvnw spring-boot:run
```
Backend API will start at: `http://localhost:8080/api/v1`

### 3. Run Frontend (React 19 + Vite)
From `frontend/`:
```bash
npm run dev
```
Open your browser at: `http://localhost:5173`
The frontend proxy will automatically route all `/api/*` calls to the Spring Boot backend at `http://localhost:8080/api/v1/*`.
