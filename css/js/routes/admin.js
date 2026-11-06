const express = require('express');
const db = require('../config/db');

const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require('../middleware/authMiddleware');

router.use(verifyToken, allowRoles('admin'));

// View all requests
router.get('/requests', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT m.*, u.full_name AS resident_name,
            c.category_name,
            s.full_name AS staff_name
            FROM maintenance_requests m
            JOIN users u ON m.user_id = u.user_id
            JOIN categories c ON m.category_id = c.category_id
            LEFT JOIN users s ON m.assigned_to = s.user_id
            ORDER BY m.request_date DESC`
        );

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to load requests'
        });
    }
});

// View staff members
router.get('/staff', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT user_id, full_name, email
             FROM users WHERE role = 'staff'`
        );

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to load staff'
        });
    }
});

// Assign staff
router.put('/requests/:id/assign', async (req, res) => {
    try {
        const { staff_id } = req.body;

        const [staff] = await db.execute(
            `SELECT user_id FROM users
             WHERE user_id = ? AND role = 'staff'`,
            [staff_id]
        );

        if (!staff.length) {
            return res.status(400).json({
                message: 'Invalid staff member'
            });
        }

        const [result] = await db.execute(
            `UPDATE maintenance_requests
             SET assigned_to = ?
             WHERE request_id = ?`,
            [staff_id, req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: 'Request not found'
            });
        }

        res.json({
            message: 'Staff assigned successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Assignment failed'
        });
    }
});

// Admin updates request status
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { status, remarks } = req.body;

        const allowed = [
            'Pending',
            'In Progress',
            'Completed',
            'Rejected'
        ];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status'
            });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `UPDATE maintenance_requests
                 SET status = ?,
                 completed_date = CASE
                    WHEN ? = 'Completed' THEN NOW()
                    ELSE NULL
                 END
                 WHERE request_id = ?`,
                [status, status, req.params.id]
            );

            if (!result.affectedRows) {
                await connection.rollback();
                return res.status(404).json({
                    message: 'Request not found'
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
                message: 'Request status updated'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        res.status(500).json({
            message: 'Status update failed'
        });
    }
});

module.exports = router;