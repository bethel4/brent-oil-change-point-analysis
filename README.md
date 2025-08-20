# Brent Oil Change Point Analysis

## Data Science Workflow

1. **Problem Definition**: Identify the impact of geopolitical and OPEC events on Brent oil price change points.
2. **Data Collection**: Gather historical Brent oil prices and major geopolitical/OPEC events.
3. **Data Cleaning & Preprocessing**: Clean, align, and preprocess the data for analysis.
4. **Exploratory Data Analysis (EDA)**: Explore trends, outliers, and relationships in the data.
5. **Feature Engineering**: Create features to capture event impacts and temporal patterns.
6. **Modeling**: Apply change point detection algorithms to identify significant shifts.
7. **Evaluation**: Assess model performance and interpret results in the context of events.
8. **Visualization & Reporting**: Visualize findings and summarize insights.
9. **Deployment**: (Optional) Build a dashboard for interactive exploration.

---

## Assumptions & Limitations

- The list of geopolitical/OPEC events is not exhaustive and focuses on major, widely reported events.
- Event impact is subjectively categorized (High/Medium/Low) based on news and market reactions.
- The timing of price reactions may not align exactly with event dates due to market lags.
- Only publicly available data is used; some events or impacts may be underreported.
- Change point detection methods may not capture all subtle or gradual shifts.
- Correlation does not imply causation; other factors may influence oil prices.

---

## Running the Dashboard (Backend + Frontend)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Recommended: `conda` or `python3 -m venv`

### 1) Backend (Flask API)

From the project root:

```bash
# Create and activate a virtual environment (pick one)
python3 -m venv .venv && source .venv/bin/activate
# or with conda
# conda env create -f environment.yml && conda activate brent-oil-change-point-analysis

# Install backend dependencies
pip install -r dashboard/backend/requirements.txt

# Run the API
python3 dashboard/backend/app.py
```

- Health check: `http://localhost:5000/api/health`
- Data endpoints:
  - `GET /api/data/oil-prices?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - `GET /api/data/oil-prices-stream` (NDJSON streaming)
  - `GET /api/data/events`
- Analysis endpoints:
  - `POST /api/analysis/change-points` (JSON body: `{ "samples": 2000, "tune": 1000 }`)
  - `GET /api/analysis/statistics`
  - `GET /api/analysis/events-impact`
- Visualization endpoints:
  - `GET /api/visualization/price-timeline`
  - `GET /api/visualization/change-point-analysis`

### 2) Frontend (React UI)

In a separate terminal:

```bash
cd dashboard/frontend
npm install
npm start
```

- Open the UI at `http://localhost:3000`
- The frontend is configured with a development proxy to `http://localhost:5000` in `dashboard/frontend/package.json`.
- To point the UI to a different API URL, set `REACT_APP_API_URL` before starting:

```bash
REACT_APP_API_URL=http://<your-api-host>:<port> npm start
```

### Running Tests

```bash
# From project root
python3 -m pytest -q
```

### Troubleshooting
- If the React dev server complains about missing `public/index.html` or `src/index.js`, ensure those files exist under `dashboard/frontend`.
- If you see Ajv-related errors when starting the frontend, ensure the following are installed in `dashboard/frontend/package.json`:
  - `"ajv": "^6.12.6"`
  - `"ajv-keywords": "^3.5.2"`
  Then run: `npm install` and `npm start`.
- Backend CORS is enabled; if you host the API on another origin, keep `REACT_APP_API_URL` consistent.

### Project Structure (Dashboard)

```
dashboard/
  backend/
    app.py
    requirements.txt
  frontend/
    package.json
    public/
      index.html
    src/
      App.js
      index.js
      components/
        Dashboard.js
        PriceTimeline.js
        ChangePointAnalysis.js
        EventsImpact.js
        Statistics.js
      services/
        apiService.js
```
