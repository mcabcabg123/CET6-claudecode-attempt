const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Stats stored in a simple JSON file
const statsFile = path.join(__dirname, 'stats.json');

function readStats() {
  try {
    return JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
  } catch {
    return {};
  }
}

function writeStats(data) {
  // Atomic write: write to temp file then rename
  const tmp = statsFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, statsFile);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function todayStats() {
  const d = today();
  const stats = readStats();
  return stats[d] || { page_views: 0, total_answers: 0, correct_answers: 0 };
}

function formatResponse(stats) {
  return {
    page_views: stats.page_views,
    total_answers: stats.total_answers,
    correct_answers: stats.correct_answers,
    accuracy: stats.total_answers > 0
      ? Math.round((stats.correct_answers / stats.total_answers) * 100)
      : 0
  };
}

// Record page visit
app.post('/api/visit', (req, res) => {
  const d = today();
  const all = readStats();
  if (!all[d]) all[d] = { page_views: 0, total_answers: 0, correct_answers: 0 };
  all[d].page_views++;
  writeStats(all);
  res.json(formatResponse(all[d]));
});

// Record answer
app.post('/api/answer', (req, res) => {
  const { correct } = req.body;
  const d = today();
  const all = readStats();
  if (!all[d]) all[d] = { page_views: 0, total_answers: 0, correct_answers: 0 };
  all[d].total_answers++;
  if (correct) all[d].correct_answers++;
  writeStats(all);
  res.json(formatResponse(all[d]));
});

// Get stats (no side effect)
app.get('/api/stats', (req, res) => {
  res.json(formatResponse(todayStats()));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
