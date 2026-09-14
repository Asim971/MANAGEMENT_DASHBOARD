const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildDashboardData } = require('./src/excel-parser');

const app = express();
const port = process.env.PORT || 3000;
const workbookPath = path.join(__dirname, 'AGI Enterprise Process Registry v1.xlsx');
const publicDir = path.join(__dirname, 'public');
const outputPath = path.join(publicDir, 'dashboard-data.json');

function generateData() {
  const data = buildDashboardData(workbookPath);
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(publicDir, 'dashboard-data.js'), `window.AGI_DASHBOARD_DATA=${JSON.stringify(data)};`);
  return data;
}

generateData();

app.use(express.static(publicDir));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`AGI dashboard running on port ${port}`);
});
