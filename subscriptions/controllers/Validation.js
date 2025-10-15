/**
 * Validation utilities for subscription service
 */

const validateSubscriptionRequest = (req, res, next) => {
    const { product, monthsPurchased } = req.body
    
    const errors = []
    
    if (!product || typeof product !== 'string' || product.trim() === '') {
        errors.push('Product is required and must be a non-empty string')
    }
    
    if (!Number.isInteger(monthsPurchased) || monthsPurchased < 1 || monthsPurchased > 12) {
        errors.push('Months purchased must be an integer between 1 and 12')
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        })
    }
    
    next()
}

const validateSubscriptionExists = async (req, res, next) => {
    try {
        const subscription = await req.repositories.subscriptionsRepository.getSubscription()
        
        if (!subscription) {
            return res.status(404).json({
                error: 'No subscription found'
            })
        }
        
        req.subscription = subscription
        next()
    } catch (error) {
        req.logger.error('Error checking subscription existence', { error: error.message })
        return res.status(500).json({
            error: 'Internal server error'
        })
    }
}

module.exports = {
    validateSubscriptionRequest,
    validateSubscriptionExists
}
