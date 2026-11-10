
const pool = require("../config/db");

const VALID_SLOTS = [
  "Morning",
  "After breakfast",
  "After lunch",
  "After dinner"
];

// ADD READING
const addReading = async (req, res) => {
  try {
    const { reading_date, time_slot, value } = req.body;
    const userId = req.user.id;

    if (value === undefined || value === null || value === "") {
      return res.status(400).json({
        message: "Please enter a glucose value."
      });
    }

    const glucoseValue = Number(value);

    if (!Number.isInteger(glucoseValue) ||
        glucoseValue < 40 || glucoseValue > 600) {
      return res.status(400).json({
        message: "Value must be between 40 and 600 mg/dl."
      });
    }

    if (!reading_date || !time_slot) {
      return res.status(400).json({
        message: "Date and time slot are required."
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date) ||
        new Date(`${reading_date}T00:00:00Z`).toISOString().slice(0, 10) !== reading_date) {
      return res.status(400).json({
        message: "Please enter a valid date."
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    if (reading_date > today) {
      return res.status(400).json({
        message: "Date cannot be in the future."
      });
    }

    if (!VALID_SLOTS.includes(time_slot)) {
      return res.status(400).json({
        message: "Please select a valid time slot."
      });
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, reading_date]
    );

    if (Number(count.rows[0].count) >= 4) {
      return res.status(400).json({
        message: "You can add only 4 readings per day."
      });
    }

    const duplicate = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
      [userId, reading_date, time_slot]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        message: `You already have an ${time_slot} reading for this date.`
      });
    }

    const result = await pool.query(
      `INSERT INTO readings
       (user_id, reading_date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, reading_date, time_slot, glucoseValue]
    );

    res.status(201).json({
      message: "Reading added successfully!",
      reading: result.rows[0]
    });

  } catch (error) {
    console.error("Add reading error:", error.message);
    res.status(500).json({
      message: "Unable to add reading."
    });
  }
};

// GET ALL READINGS
const getReadings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, reading_date, time_slot, value, created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, id DESC`,
      [req.user.id]
    );

    res.json({
      readings: result.rows
    });

  } catch (error) {
    console.error("Get readings error:", error.message);
    res.status(500).json({
      message: "Unable to fetch readings."
    });
  }
};

// UPDATE READING
const updateReading = async (req, res) => {
  try {
    const { reading_date, time_slot, value } = req.body;
    const { id } = req.params;

    if (value === undefined || value === null || value === "") {
      return res.status(400).json({
        message: "Please enter a glucose value."
      });
    }

    const glucoseValue = Number(value);

    if (!Number.isInteger(glucoseValue) ||
        glucoseValue < 40 || glucoseValue > 600) {
      return res.status(400).json({
        message: "Value must be between 40 and 600 mg/dl."
      });
    }

    if (!reading_date || !time_slot ||
        !/^\d{4}-\d{2}-\d{2}$/.test(reading_date) ||
        !VALID_SLOTS.includes(time_slot)) {
      return res.status(400).json({
        message: "Please enter a valid date and time slot."
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    if (reading_date > today) {
      return res.status(400).json({
        message: "Date cannot be in the future."
      });
    }

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [reading_date, time_slot, glucoseValue, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found."
      });
    }

    res.json({
      message: "Reading updated successfully!",
      reading: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading already exists for this time slot and date."
      });
    }

    console.error("Update reading error:", error.message);
    res.status(500).json({
      message: "Unable to update reading."
    });
  }
};

// DELETE READING
const deleteReading = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found."
      });
    }

    res.json({
      message: "Reading deleted successfully!"
    });

  } catch (error) {
    console.error("Delete reading error:", error.message);
    res.status(500).json({
      message: "Unable to delete reading."
    });
  }
};

module.exports = {
  addReading,
  getReadings,
  updateReading,
  deleteReading
};

