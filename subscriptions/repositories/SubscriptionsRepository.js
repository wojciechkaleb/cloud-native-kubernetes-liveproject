const domain = require('../domain/SubscriptionDetails')

let subscriptionKey = "subscription"

class SubscriptionsRepository {
    constructor(client) {
        this.client = client
    }

    async addOrReplaceSubscription(subscription) {
        let len = await this.client.hlen(subscriptionKey)
        
        if(len > 0) {
            // If there is already an existing subscription, we're
            // going to replace that. Remove the old one first just
            // to make sure.
            await this.removeSubscription()
        }

        const data = this.transformToRepositoryFormat(subscription)
        await this.client.hmset(subscriptionKey, data)
    }

    async getSubscription() {
        let len = await this.client.hlen(subscriptionKey)
        
        if(len <= 0) {
            return null // No subscription found
        }

        const data = await this.client.hgetall(subscriptionKey)
        return this.transformToDomainFormat(data)
    }

    async removeSubscription() {
        let len = await this.client.hlen(subscriptionKey)
        
        if(len <= 0) {
            return
        }

        let fields = await this.client.hkeys(subscriptionKey)
        return await this.client.hdel(subscriptionKey, fields)
    }

    transformToRepositoryFormat(subscription) {
        return {
            "product": subscription.product,
            "monthsPurchased": subscription.monthsPurchased.toString(),
            "status": subscription.status,
            "datePurchased": subscription.datePurchased,
            "dateExpires": subscription.dateExpires
        }
    }

    transformToDomainFormat(data) {
        const { product, monthsPurchased, status, datePurchased, dateExpires } = data

        return new domain.Subscription(
            product,
            parseInt(monthsPurchased),
            status,
            datePurchased,
            dateExpires
        )
    }
}

module.exports = (client) => new SubscriptionsRepository(client)
