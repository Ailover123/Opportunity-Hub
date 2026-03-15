const express = require('express');
const router = express.Router();
const { db } = require('../../utils/db');

// Get Upcoming Meetings for User
router.get('/my-meetings', (req, res) => {
  const userId = req.user.id;


  // Real implementation would look at calendar table
  // For the SaaS demo, we return deterministic meetings based on team participation
  const query = `
    SELECT t.name as team_name, 'Strategy Sync' as title, 'Today, 5:00 PM' as time 
    FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = ?
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
