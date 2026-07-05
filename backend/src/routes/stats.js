import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get Cash Flow analytics stats
router.get('/stats', async (req, res) => {
  try {
    // Overall summaries
    const sumResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END) as total_inflow,
        SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END) as total_outflow
      FROM transactions
    `);

    // Grouped by day for chart visualizer
    const dailyResult = await pool.query(`
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as date,
        SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END)::float as inflow,
        SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END)::float as outflow
      FROM transactions
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    const totalInflow = parseFloat(sumResult.rows[0].total_inflow || 0);
    const totalOutflow = parseFloat(sumResult.rows[0].total_outflow || 0);

    res.json({
      summary: {
        totalInflow,
        totalOutflow,
        netCash: totalInflow - totalOutflow
      },
      dailyData: dailyResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stats query failed' });
  }
});

export default router;
