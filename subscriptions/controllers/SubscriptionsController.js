const express = require('express')
const domain = require('../domain/SubscriptionDetails')
const { validateSubscriptionRequest, validateSubscriptionExists } = require('./Validation')

class SubscriptionsController {
    constructor(repositories, logger, config) {
        this.repositories = repositories
        this.logger = logger
        this.config = config
        this.router = express.Router()
        this.setupRoutes()
    }

    setupRoutes() {
        // GET /subscriptions - Get current subscription
        this.router.get('/', this.getSubscription.bind(this))
        
        // POST /subscriptions - Add or update subscription
        this.router.post('/', validateSubscriptionRequest, this.createOrUpdateSubscription.bind(this))
        
        // DELETE /subscriptions - Cancel subscription
        this.router.delete('/', validateSubscriptionExists, this.cancelSubscription.bind(this))
    }

    async getSubscription(req, res) {
        try {
            const subscription = await this.repositories.subscriptionsRepository.getSubscription()
            
            if (!subscription) {
                return res.status(404).json({
                    error: 'No subscription found'
                })
            }

            // Check if subscription is still active
            if (subscription.isExpired()) {
                subscription.status = 'expired'
                await this.repositories.subscriptionsRepository.addOrReplaceSubscription(subscription)
            }

            const response = subscription.toResponse()
            this.logger.info('Subscription retrieved successfully', { 
                product: response.product,
                status: response.status 
            })
            
            res.status(200).json(response)
        } catch (error) {
            this.logger.error('Error getting subscription', { error: error.message })
            res.status(500).json({
                error: 'Internal server error'
            })
        }
    }

    async createOrUpdateSubscription(req, res) {
        try {
            const { product, monthsPurchased } = req.body
            
            // Get existing subscription to calculate refund if needed
            const existingSubscription = await this.repositories.subscriptionsRepository.getSubscription()
            
            // Create new subscription
            const subscription = new domain.Subscription(product, monthsPurchased)
            
            // Calculate payment/refund if there's an existing subscription
            if (existingSubscription && existingSubscription.isActive()) {
                const paymentResult = await this.processSubscriptionChange(existingSubscription, subscription)
                
                if (!paymentResult.success) {
                    return res.status(400).json({
                        error: 'Payment processing failed',
                        details: paymentResult.error
                    })
                }
            } else {
                // Process payment for new subscription
                const paymentResult = await this.processNewSubscriptionPayment(subscription)
                
                if (!paymentResult.success) {
                    return res.status(400).json({
                        error: 'Payment processing failed',
                        details: paymentResult.error
                    })
                }
            }
            
            // Save subscription
            await this.repositories.subscriptionsRepository.addOrReplaceSubscription(subscription)
            
            const response = subscription.toResponse()
            this.logger.info('Subscription created/updated successfully', { 
                product: response.product,
                monthsPurchased: response.monthsPurchased,
                status: response.status 
            })
            
            res.status(200).json(response)
        } catch (error) {
            this.logger.error('Error creating/updating subscription', { error: error.message })
            res.status(500).json({
                error: 'Internal server error'
            })
        }
    }

    async cancelSubscription(req, res) {
        try {
            const subscription = req.subscription
            
            if (subscription.status === 'cancelled') {
                return res.status(400).json({
                    error: 'Subscription is already cancelled'
                })
            }
            
            // Process refund if subscription is active and not expired
            if (subscription.isActive()) {
                const refundResult = await this.processSubscriptionRefund(subscription)
                
                if (!refundResult.success) {
                    return res.status(400).json({
                        error: 'Refund processing failed',
                        details: refundResult.error
                    })
                }
            }
            
            // Cancel subscription
            subscription.cancel()
            await this.repositories.subscriptionsRepository.addOrReplaceSubscription(subscription)
            
            this.logger.info('Subscription cancelled successfully', { 
                product: subscription.product,
                status: subscription.status 
            })
            
            res.status(200).json({
                message: 'Subscription cancelled successfully'
            })
        } catch (error) {
            this.logger.error('Error cancelling subscription', { error: error.message })
            res.status(500).json({
                error: 'Internal server error'
            })
        }
    }

    async processNewSubscriptionPayment(subscription) {
        try {
            const axios = require('axios')
            
            // Calculate amount based on subscription duration
            const amount = this.calculateSubscriptionAmount(subscription.monthsPurchased)
            
            const paymentRequest = {
                type: 'payment',
                amount: amount
            }
            
            const response = await axios.post(
                `${this.config.payments_service_url}/api/payment-methods/process`,
                paymentRequest,
                { timeout: 5000 }
            )
            
            return { success: true, data: response.data }
        } catch (error) {
            this.logger.error('Payment processing failed', { error: error.message })
            return { 
                success: false, 
                error: error.response?.data?.error || 'Payment service unavailable' 
            }
        }
    }

    async processSubscriptionChange(oldSubscription, newSubscription) {
        try {
            const axios = require('axios')
            
            const oldAmount = this.calculateSubscriptionAmount(oldSubscription.monthsPurchased)
            const newAmount = this.calculateSubscriptionAmount(newSubscription.monthsPurchased)
            const difference = newAmount - oldAmount
            
            if (difference > 0) {
                // Charge additional amount
                const paymentRequest = {
                    type: 'payment',
                    amount: difference
                }
                
                await axios.post(
                    `${this.config.payments_service_url}/api/payment-methods/process`,
                    paymentRequest,
                    { timeout: 5000 }
                )
            } else if (difference < 0) {
                // Refund difference
                const refundRequest = {
                    type: 'refund',
                    amount: Math.abs(difference)
                }
                
                await axios.post(
                    `${this.config.payments_service_url}/api/payment-methods/process`,
                    refundRequest,
                    { timeout: 5000 }
                )
            }
            
            return { success: true }
        } catch (error) {
            this.logger.error('Subscription change payment processing failed', { error: error.message })
            return { 
                success: false, 
                error: error.response?.data?.error || 'Payment service unavailable' 
            }
        }
    }

    async processSubscriptionRefund(subscription) {
        try {
            const axios = require('axios')
            
            const amount = this.calculateSubscriptionAmount(subscription.monthsPurchased)
            
            const refundRequest = {
                type: 'refund',
                amount: amount
            }
            
            const response = await axios.post(
                `${this.config.payments_service_url}/api/payment-methods/process`,
                refundRequest,
                { timeout: 5000 }
            )
            
            return { success: true, data: response.data }
        } catch (error) {
            this.logger.error('Refund processing failed', { error: error.message })
            return { 
                success: false, 
                error: error.response?.data?.error || 'Payment service unavailable' 
            }
        }
    }

    calculateSubscriptionAmount(monthsPurchased) {
        // Simple pricing model: $10 per month
        const pricePerMonth = 10
        return monthsPurchased * pricePerMonth
    }
}

module.exports = (repositories, logger, config) => {
    const controller = new SubscriptionsController(repositories, logger, config)
    return controller.router
}
