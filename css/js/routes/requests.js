const express = require('express');
const db = require('../config/db');

const router = express.Router();

const {
    verifyToken,
    allowRoles
} = require('../middleware/authMiddleware');

// Get categories
router.get('/categories', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM categories ORDER BY category_name'
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load categories' });
    }
});

// Submit complaint
router.post(
    '/',
    verifyToken,
    allowRoles('resident'),
    async (req, res) => {
        try {
            const {
                category_id,
                title,
                description,
                priority
            } = req.body;

            if (!category_id || !title || !description) {
                return res.status(400).json({
                    message: 'Please fill all required fields'
                });
            }

            const [categories] = await db.execute(
                'SELECT category_id FROM categories WHERE category_id = ?',
                [category_id]
            );

            if (!categories.length) {
                return res.status(400).json({
                    message: 'Invalid category'
                });
            }

            const [result] = await db.execute(
                `INSERT INTO maintenance_requests
                (user_id, category_id, title, description, priority)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    req.user.user_id,
                    category_id,
                    title,
                    description,
                    ['Low', 'Medium', 'High'].includes(priority)
                        ? priority
                        : 'Medium'
                ]
            );

            res.status(201).json({
                message: 'Maintenance request submitted',
                request_id: result.insertId
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Unable to submit request'
            });
        }
    }
);

// Resident views own requests
router.get(
    '/my',
    verifyToken,
    allowRoles('resident'),
    async (req, res) => {
        try {
            const [rows] = await db.execute(
                `SELECT m.*, c.category_name,
                u.full_name AS staff_name
                FROM maintenance_requests m
                JOIN categories c ON m.category_id = c.category_id
                LEFT JOIN users u ON m.assigned_to = u.user_id
                WHERE m.user_id = ?
                ORDER BY m.request_date DESC`,
                [req.user.user_id]
            );

            res.json(rows);

        } catch (error) {
            res.status(500).json({
                message: 'Unable to load requests'
            });
        }
    }
);

// Resident views updates of their own request
router.get(
    '/:id/updates',
    verifyToken,
    allowRoles('resident', 'admin', 'staff'),
    async (req, res) => {
        try {
            const [rows] = await db.execute(
                `SELECT ru.*, u.full_name
                 FROM request_updates ru
                 JOIN users u ON ru.updated_by = u.user_id
                 JOIN maintenance_requests m
                   ON ru.request_id = m.request_id
                 WHERE ru.request_id = ?
                 AND (
                    m.user_id = ?
                    OR ? = 'admin'
                    OR m.assigned_to = ?
                 )
                 ORDER BY ru.updated_at DESC`,
                [
                    req.params.id,
                    req.user.user_id,
                    req.user.role,
                    req.user.user_id
                ]
            );

            res.json(rows);

        } catch (error) {
            res.status(500).json({
                message: 'Unable to load updates'
            });
        }
    }
);

module.exports = router;