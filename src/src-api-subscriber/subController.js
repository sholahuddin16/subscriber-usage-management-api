const { subServices, ServiceError } = require('./subServices');

/**
 * Controller layer for Huawei Subscriber management.
 * Handles HTTP requests and delegates to subServices.
 */
const subController = {
  /**
   * GET /api/subscribers
   * Retrieve all subscribers.
   */
  async getAllSubscribers(req, res, next) {
    try {
      const subscribers = await subServices.getAllSubscribers();
      return res.status(200).json({
        success: true,
        message: 'Subscribers retrieved successfully',
        data: subscribers,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in getAllSubscribers:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching subscribers',
      });
    }
  },

  /**
   * GET /api/subscribers/plan
   * Retrieve all subscribers plan.
   */
  async getAllPlanSub(req, res, next) {
    try {
      const subscribers = await subServices.getAllPlanSub();
      return res.status(200).json({
        success: true,
        message: 'Subscriber Plan retrieved successfully',
        data: subscribers,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in getAllPlanSub:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching subscriber plan',
      });
    }
  },

  /**
   * GET /api/subscribers/:id
   * Retrieve subscriber detail by primary key (pk_huawei_subscriber_id).
   */
  async getSubscriberById(req, res, next) {
    try {
      const { id } = req.params;
      const subscriber = await subServices.getSubscriberById(id);
      return res.status(200).json({
        success: true,
        message: 'Subscriber retrieved successfully',
        data: subscriber,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in getSubscriberById:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching subscriber detail',
      });
    }
  },

  /**
   * POST /api/subscribers
   * Create a new subscriber.
   */
  async createSubscriber(req, res) {
    try {
      const newSubscriber = await subServices.createSubscriber(req.body);
      return res.status(201).json({
        success: true,
        message: 'Subscriber created successfully',
        data: newSubscriber,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in createSubscriber:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating subscriber',
      });
    }
  },

  /**
   * PUT /api/subscribers/:id
   * Update subscriber by primary key (pk_huawei_subscriber_id).
   */
  async updateSubscriber(req, res, next) {
    try {
      const { id } = req.params;
      const updatedSubscriber = await subServices.updateSubscriber(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Subscriber updated successfully',
        data: updatedSubscriber,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in updateSubscriber:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating subscriber',
      });
    }
  },

  /**
   * DELETE /api/subscribers/:id
   * Delete subscriber by primary key (pk_huawei_subscriber_id).
   */
  async deleteSubscriber(req, res, next) {
    try {
      const { id } = req.params;
      const deletedSubscriber = await subServices.deleteSubscriber(id);
      return res.status(200).json({
        success: true,
        message: 'Subscriber deleted successfully',
        data: deletedSubscriber,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in deleteSubscriber:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deleting subscriber',
      });
    }
  },
};

module.exports = subController;
