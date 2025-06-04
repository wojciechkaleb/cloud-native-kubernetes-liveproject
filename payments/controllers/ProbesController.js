class ProbesController {
    constructor(logger) {
        this.logger = logger
    }

    async handleLiveness(req, res) {
        this.logger.info('Liveness probe')
        res.status(200).json({ status: 'UP' });
    }

    async handleReadiness(req, res) {
        this.logger.info('Readiness probe')
        res.status(200).json({ status: 'UP' });
    }
}

module.exports = (repositories, logger) => {
    const controller = new ProbesController(logger)
    const express = require('express')
    const router = express.Router()

    // Handle both /healthz/readiness and /readiness paths
    router.get('/readiness', function (req, res) {
        controller.handleReadiness(req, res)
    })

    // Handle both /healthz/liveness and /liveness paths
    router.get('/liveness', function (req, res) {
        controller.handleLiveness(req, res)
    })

    return router
}
