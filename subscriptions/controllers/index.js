module.exports = (app, repositories, logger, config) => {
    const loadSubscriptionsController = require('./SubscriptionsController')
    const loadHealthController = require('./HealthController')
    
    app.use("/api/subscriptions", loadSubscriptionsController(repositories, logger, config))
    app.use("/health", loadHealthController(repositories, logger, config))
}
