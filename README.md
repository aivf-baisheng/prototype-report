# Report App

A full-stack application for displaying and analyzing test reports with confidence intervals. Built with React (Vite) for the frontend and FastAPI for the backend.

## Project Structure

```
report-app/
├── backend/           # FastAPI backend
│   ├── data/         # JSON data files
│   │   ├── bundles.json
│   │   └── bundlestest.json
│   ├── main.py       # Main FastAPI application
│   └── requirements.txt
├── src/              # React frontend
│   ├── App.jsx
│   ├── App.css
│   ├── TestReport.jsx
│   └── TestReport.css
├── public/           # Static files
└── index.html
```

## Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
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
   npm start
   ```
   The frontend will run on http://localhost:3000

## API Endpoints

- `GET /api/bundles`: Retrieve test bundles with their recipes, prompts, and confidence intervals
- `GET /`: Health check endpoint

## Data Structure

The application expects bundle data in the following format:
```json
{
  "bundles": [
    {
      "name": "BundleName",
      "percentage": 85.5,
      "recipes": [
        {
          "recipe_name": "RecipeName",
          "percentage": 85.5,
          "ci_minimum_band": 80,
          "ci_maximum_band": 90,
          "prompts": [...]
        }
      ]
    }
  ]
}
```

## Development

The project includes VS Code tasks for running both frontend and backend servers. To use them:

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Run Task"
3. Select "Start Development Environment"

## Features

- Display test results with confidence intervals
- Bundle and recipe-level metrics
- Interactive data visualization
- Responsive design
- Real-time data updates

## License

MIT