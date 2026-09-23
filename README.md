# QA Evidence Hub

QA Evidence Hub is a test-case workspace for capturing requirements, objectives, preconditions, test data, execution steps, and evidence. It includes a FastAPI/SQLAlchemy API with Alembic migrations, Pillow image uploads, image-embedded DOCX reports, and a React/Vite/Tailwind dashboard using Router, Axios, Lucide, Framer Motion, and Recharts.

## Local development

### API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000` and OpenAPI docs at `/docs`.
For local development the default is SQLite. To use PostgreSQL, set
`DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/qa_evidence`
before starting the API.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` when the API is not running on localhost. The UI supports case CRUD, dashboard metrics/charts, dynamic steps, URL evidence, image uploads, clone/delete, and DOCX report downloads. Uploaded images are served from `/uploads` and their filename, MIME type, size, and storage path are retained as evidence metadata.

## Deployment

`render.yaml` defines the frontend, API, and a managed PostgreSQL database. Configure
persistent disk storage (or object storage) for `/uploads` in production so uploaded
evidence survives deploys. The API runs Alembic migrations as part of the deployment
setup when you execute `alembic upgrade head`.
