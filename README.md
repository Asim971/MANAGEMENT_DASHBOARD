# AGI Enterprise Transformation Dashboard

Static-generated dashboard derived from `AGI Enterprise Process Registry v1.xlsx`. The visible maturity model follows the supplied control-tower design: S0-S5 transformation states and E0-E5 evidence levels remain separate, and project completion never becomes verified maturity.

## Local Run

```bash
npm install
npm start
```

Open `http://localhost:3000`. The generated `public/index.html` can also be opened directly after `npm run build:data`; it uses the embedded `public/dashboard-data.js` artifact.

## Data Generation

The server regenerates `public/dashboard-data.json` and `public/dashboard-data.js` at startup.

```bash
npm run build:data
```

## Railway

Railway installs dependencies and runs `npm start`. The server binds to `process.env.PORT || 3000`; the included `railway.json` supplies the start command.

## Evidence guardrails

The v1 workbook is an evidence baseline. It currently shows 94 uncalibrated registry rows, no live E3 waves, no measured E4 waves, and no verified E5 outcomes. O2C shows AOPL as the provisional first-to-check only; no SBU is selected until all seven mandatory live-evidence gates pass and the 15 data-quality gates are run.
