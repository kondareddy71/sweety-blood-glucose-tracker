
const pool = require("../config/db");

const getReports = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    // Validate selected date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "Please provide a valid date (YYYY-MM-DD)."
      });
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message: "Please provide a valid date."
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    if (date > today) {
      return res.status(400).json({
        message: "Date cannot be in the future."
      });
    }

    const selected = new Date(`${date}T00:00:00Z`);

    const year = selected.getUTCFullYear();
    const month = selected.getUTCMonth();

    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const previousMonthDate = new Date(Date.UTC(year, month - 1, 1));

    const previousMonthStart =
      `${previousMonthDate.getUTCFullYear()}-${String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0")}-01`;

    const previousMonthEnd = monthStart;

    const daily = await pool.query(
      `SELECT
         COUNT(*)::int AS count,
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1) AS average
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, date]
    );

    const dailyReadings = await pool.query(
      `SELECT id, reading_date, time_slot, value
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY
         CASE time_slot
           WHEN 'Morning' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
         END`,
      [userId, date]
    );

    const monthToDate = await pool.query(
      `SELECT
         COUNT(*)::int AS count,
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1) AS average
       FROM readings
       WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date <= $3`,
      [userId, monthStart, date]
    );

    const previousMonth = await pool.query(
      `SELECT
         COUNT(*)::int AS count,
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1) AS average
       FROM readings
       WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date < $3`,
      [userId, previousMonthStart, previousMonthEnd]
    );

    res.json({
      selectedDate: date,
      daily: {
        ...daily.rows[0],
        readings: dailyReadings.rows
      },
      monthToDate: {
        startDate: monthStart,
        endDate: date,
        ...monthToDate.rows[0]
      },
      previousMonth: {
        startDate: previousMonthStart,
        endDate: previousMonthEnd,
        ...previousMonth.rows[0]
      }
    });

  } catch (error) {
    console.error("Report error:", error.message);
    res.status(500).json({
      message: "Unable to generate reports."
    });
  }
};

module.exports = { getReports };
