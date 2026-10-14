const express = require('express');
const router = express.Router();
const subController = require('./subController');

/**
 * Routes for Huawei Subscriber Management
 * Mounted at: /api/subscribers
 */

// GET /api/subscribers - Get all subscribers
router.get('/', subController.getAllSubscribers);

// GET /api/subscribers/plan - Get all subscriber plan
router.get('/plan', subController.getAllPlanSub);

// GET /api/subscribers/:id - Get subscriber by primary key
router.get('/:id', subController.getSubscriberById);

// POST /api/subscribers - Create a new subscriber
router.post('/', subController.createSubscriber);

// PUT /api/subscribers/:id - Update subscriber by primary key
router.put('/:id', subController.updateSubscriber);

// DELETE /api/subscribers/:id - Delete subscriber by primary key
router.delete('/:id', subController.deleteSubscriber);

module.exports = router;
