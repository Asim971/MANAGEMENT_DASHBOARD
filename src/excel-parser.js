const fs = require('fs');
const XLSX = require('xlsx');

const value = (row, key) => row[key] === undefined || row[key] === null ? '' : String(row[key]).trim();
const rowsFrom = (sheet, headerStartsWith) => {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  let headerIndex = 0;
  if (headerStartsWith) headerIndex = rows.findIndex(row => String(row[0]).trim() === headerStartsWith);
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(cell => String(cell).trim());
  return rows.slice(headerIndex + 1).filter(row => row.some(cell => String(cell).trim() !== '')).map(row =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']).filter(([header]) => header))
  );
};
const countBy = (rows, key) => rows.reduce((out, row) => { const k = value(row, key) || '(blank)'; out[k] = (out[k] || 0) + 1; return out; }, {});
const total = (obj) => Object.values(obj).reduce((sum, n) => sum + n, 0);
const latestDate = rows => rows.map(row => value(row, 'Last Updated')).filter(Boolean).sort().at(-1) || '2026-09-14';

function buildDashboardData(workbookPath) {
  if (!workbookPath || !fs.existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}`);
  const workbook = XLSX.readFile(workbookPath, { cellDates: true });
  const sheet = name => workbook.Sheets[name];
  const portfolio = rowsFrom(sheet('Dashboard Inputs')).filter(row => ['Complete', 'Registry baseline'].includes(value(row, 'Design Pack')));
  const registry = rowsFrom(sheet('Process Registry'));
  const waves = rowsFrom(sheet('Calibration Waves'));
  const processSpotlights = [
    { key: 'O2C', name: 'Order-to-Cash', tree: null, metrics: 'O2C Metric Dictionary', evidence: null, stage: 'Leading implementation area' },
    { key: 'S2P', name: 'Source-to-Pay', tree: 'Wave2 S2P Process Tree', metrics: 'S2P Metric Dictionary', evidence: 'S2P Evidence Requirements', stage: 'Design complete / calibration pending' },
    { key: 'D2POD', name: 'Delivery-to-POD', tree: 'Wave3 D2POD Process Tree', metrics: 'D2POD Metric Dictionary', evidence: 'D2POD Evidence Requirements', stage: 'Design complete / calibration pending' },
    { key: 'A2P', name: 'Attendance-to-Payroll', tree: 'Wave4 A2P Process Tree', metrics: 'A2P Metric Dictionary', evidence: 'A2P Evidence Requirements', stage: 'Design complete / calibration pending' },
    { key: 'P2P', name: 'Plan-to-Produce', tree: 'Wave5 P2P Process Tree', metrics: 'P2P Metric Dictionary', evidence: 'P2P Evidence Requirements', stage: 'Design complete / calibration pending' }
  ].map(item => ({ ...item, processCount: item.tree ? rowsFrom(sheet(item.tree)).length : 14, metricCount: rowsFrom(sheet(item.metrics)).length, evidenceCount: item.evidence ? rowsFrom(sheet(item.evidence)).length : 0, wave: waves.find(w => value(w, 'Journey').includes(item.key) || value(w, 'Journey').includes(item.name)) || {} }));
  const o2cSbuSummary = rowsFrom(sheet('O2C Pilot Evidence Intake'), 'SBU').filter(row => /^[A-Z]{3,4}$/.test(value(row, 'SBU')));
  const o2cPilotIntake = rowsFrom(sheet('O2C Pilot Evidence Intake'), 'Intake ID').filter(row => /^.+-DR-O2C-\d+$/.test(value(row, 'Intake ID')));
  const o2cDataQualityGates = rowsFrom(sheet('O2C Data Quality Gates'), 'Gate ID');
  const currentStates = countBy(registry, 'Current State (Provisional)');
  const targetStates = countBy(registry, 'Target State (Provisional)');
  const evidence = countBy(registry, 'Evidence Level (Provisional)');
  const uncalibrated = registry.filter(row => value(row, 'Calibration Status').toLowerCase().includes('not calibrated')).length;
  const designComplete = portfolio.filter(row => value(row, 'Design Pack') === 'Complete').length;
  const evidenceReviewed = portfolio.filter(row => value(row, 'Provisional Evidence Review') === 'Complete').length;
  const liveCalibration = portfolio.filter(row => value(row, 'Live Calibration').toLowerCase() === 'complete').length;
  return {
    generatedAt: new Date().toISOString(),
    source: { workbook: 'AGI Enterprise Process Registry v1.xlsx', asOf: latestDate(portfolio) },
    portfolio, registry, waves, processSpotlights, o2cSbuSummary, o2cPilotIntake, o2cDataQualityGates,
    states: rowsFrom(sheet('Transformation States')),
    evidenceLevels: rowsFrom(sheet('Evidence Levels')),
    summary: {
      functionalWings: portfolio.length,
      canonicalProcesses: registry.length,
      designWavesComplete: waves.length,
      designPacksComplete: designComplete,
      provisionalEvidenceReviews: evidenceReviewed,
      liveE3Waves: liveCalibration,
      measuredE4Waves: 0,
      verifiedE5Waves: 0,
      uncalibratedProcesses: uncalibrated,
      currentStates, targetStates, evidence,
      o2cSegments: 14,
      o2cPilotKpis: 15,
      o2cEventFields: 33,
      o2cMandatoryGates: 7,
      o2cP0RequestCount: o2cSbuSummary.reduce((sum, row) => sum + Number(row['P0 Requests'] || 0), 0),
      o2cDataQualityGateCount: o2cDataQualityGates.length,
      o2cDataQualityNotRun: o2cDataQualityGates.filter(row => value(row, 'Status') === 'Not run').length
    }
  };
}

module.exports = { buildDashboardData };
