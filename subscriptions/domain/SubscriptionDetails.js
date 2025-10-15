/**
 * Domain models for Subscription Service
 * Based on OpenAPI specification for SecurityNewsSource
 */

class SubscriptionRequest {
    constructor(product, monthsPurchased) {
        this.product = product
        this.monthsPurchased = monthsPurchased
    }

    validate() {
        const errors = []
        
        if (!this.product || typeof this.product !== 'string' || this.product.trim() === '') {
            errors.push('Product is required and must be a non-empty string')
        }
        
        if (!Number.isInteger(this.monthsPurchased) || this.monthsPurchased < 1 || this.monthsPurchased > 12) {
            errors.push('Months purchased must be an integer between 1 and 12')
        }
        
        return errors
    }
}

class SubscriptionResponse {
    constructor(product, monthsPurchased, status, datePurchased = null, dateExpires = null) {
        this.product = product
        this.monthsPurchased = monthsPurchased
        this.status = status
        this.datePurchased = datePurchased
        this.dateExpires = dateExpires
    }

    static fromSubscription(subscription) {
        return new SubscriptionResponse(
            subscription.product,
            subscription.monthsPurchased,
            subscription.status,
            subscription.datePurchased,
            subscription.dateExpires
        )
    }
}

class Subscription {
    constructor(product, monthsPurchased, status = 'active', datePurchased = null, dateExpires = null) {
        this.product = product
        this.monthsPurchased = monthsPurchased
        this.status = status
        this.datePurchased = datePurchased || new Date().toISOString()
        this.dateExpires = dateExpires || this.calculateExpirationDate()
    }

    calculateExpirationDate() {
        const purchaseDate = new Date(this.datePurchased)
        const expirationDate = new Date(purchaseDate)
        expirationDate.setMonth(expirationDate.getMonth() + this.monthsPurchased)
        return expirationDate.toISOString()
    }

    isActive() {
        if (this.status !== 'active') {
            return false
        }
        
        const now = new Date()
        const expirationDate = new Date(this.dateExpires)
        return now < expirationDate
    }

    isExpired() {
        const now = new Date()
        const expirationDate = new Date(this.dateExpires)
        return now >= expirationDate
    }

    cancel() {
        this.status = 'cancelled'
        return this
    }

    toResponse() {
        return SubscriptionResponse.fromSubscription(this)
    }
}

module.exports = {
    SubscriptionRequest,
    SubscriptionResponse,
    Subscription
}
