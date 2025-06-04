module.exports = (app, repositories, logger) => {
    const loadPaymentsController = require('./PaymentsController')
    const loadProbesController = require('./ProbesController')
    app.use("/api/payment-methods", loadPaymentsController(repositories, logger))
    app.use("/health", loadProbesController(repositories, logger))
}

