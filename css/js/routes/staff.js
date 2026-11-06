const express = require('express');
const db = require('../config/db');

const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require('../middleware/authMiddleware');

router.use(verifyToken, allowRoles('staff'));

// View assigned tasks
router.get('/tasks', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT m.*, c.category_name,
            u.full_name AS resident_name,
            u.apartment_no
            FROM maintenance_requests m
            JOIN categories c ON m.category_id = c.category_id
            JOIN users u ON m.user_id = u.user_id
            WHERE m.assigned_to = ?
            ORDER BY m.request_date DESC`,
            [req.user.user_id]
        );

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to load tasks'
        });
    }
});

// Update assigned task
router.put('/tasks/:id/status', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { status, remarks } = req.body;

        const allowed = ['In Progress', 'Completed'];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status'
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE maintenance_requests
             SET status = ?,
             completed_date = CASE
                WHEN ? = 'Completed' THEN NOW()
                ELSE NULL
             END
             WHERE request_id = ? AND assigned_to = ?`,
            [
                status,
                status,
                req.params.id,
                req.user.user_id
            ]
        );

        if (!result.affectedRows) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Assigned task not found'
            });
        }

        await connection.execute(
            `INSERT INTO request_updates
            (request_id, updated_by, status, remarks)
            VALUES (?, ?, ?, ?)`,
            [
                req.params.id,
                req.user.user_id,
                status,
                remarks || ''
            ]
        );

        await connection.commit();

        res.json({
            message: 'Task updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({
            message: 'Unable to update task'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;