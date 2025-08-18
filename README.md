# Report App

A full-stack application for displaying and analyzing test reports. Built with React (frontend) and FastAPI (backend).

## Project Structure

```
report-app/
├── backend/           # FastAPI backend
│   ├── data/         # JSON data files
│   ├── main.py       # Main FastAPI application
│   └── requirements.txt
└── frontend/         # React frontend
    ├── src/          # Source files
    ├── public/       # Static files
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload
   ```
   The backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to the project root:
   ```bash
   cd report-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## API Endpoints

- `GET /api/bundles`: Retrieve all test bundles with their recipes and prompts
- `GET /`: Health check endpoint

## Development

The project includes VS Code tasks for running both frontend and backend servers. To use them:

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Run Task"
3. Select "Start Development Environment"

## License

MIT