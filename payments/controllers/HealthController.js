const express = require('express')

class HealthController {
    constructor(repositories, logger) {
        this.repositories = repositories
        this.logger = logger
        this.router = express.Router()
        this.setupRoutes()
    }

    setupRoutes() {
        // Liveness probe - checks if the application is running
        this.router.get('/live', (req, res) => {
            this.liveness(req, res)
        })

        // Readiness probe - checks if the application is ready to serve traffic
        this.router.get('/ready', (req, res) => {
            this.readiness(req, res)
        })

        // General health endpoint that combines both checks
        this.router.get('/health', (req, res) => {
            this.health(req, res)
        })
    }

    // Liveness probe: Basic check that the application is running
    // This should only fail if the application is completely broken
    liveness(req, res) {
        try {
            const healthStatus = {
                status: 'UP',
                timestamp: new Date().toISOString(),
                service: 'payments',
                version: process.env.npm_package_version || '1.0.0',
                uptime: process.uptime()
            }

            this.logger.debug('Liveness probe check passed')
            res.status(200).json(healthStatus)
        } catch (error) {
            this.logger.error('Liveness probe check failed', { error: error.message })
            res.status(503).json({
                status: 'DOWN',
                timestamp: new Date().toISOString(),
                service: 'payments',
                error: 'Application is not healthy'
            })
        }
    }

    // Readiness probe: Check if the application is ready to serve traffic
    // This includes checking dependencies like Redis
    async readiness(req, res) {
        try {
            const checks = {
                redis: await this.checkRedisConnection(),
                service: 'UP'
            }

            const allChecksPass = Object.values(checks).every(status => status === 'UP')
            
            const healthStatus = {
                status: allChecksPass ? 'UP' : 'DOWN',
                timestamp: new Date().toISOString(),
                service: 'payments',
                checks: checks
            }

            if (allChecksPass) {
                this.logger.debug('Readiness probe check passed', { checks })
                res.status(200).json(healthStatus)
            } else {
                this.logger.warn('Readiness probe check failed', { checks })
                res.status(503).json(healthStatus)
            }
        } catch (error) {
            this.logger.error('Readiness probe check failed', { error: error.message })
            res.status(503).json({
                status: 'DOWN',
                timestamp: new Date().toISOString(),
                service: 'payments',
                error: 'Service is not ready',
                details: error.message
            })
        }
    }

    // Combined health check endpoint
    async health(req, res) {
        try {
            const livenessCheck = this.isApplicationHealthy()
            const redisCheck = await this.checkRedisConnection()
            
            const checks = {
                liveness: livenessCheck ? 'UP' : 'DOWN',
                redis: redisCheck,
                service: 'UP'
            }

            const allChecksPass = Object.values(checks).every(status => status === 'UP')
            
            const healthStatus = {
                status: allChecksPass ? 'UP' : 'DOWN',
                timestamp: new Date().toISOString(),
                service: 'payments',
                version: process.env.npm_package_version || '1.0.0',
                uptime: process.uptime(),
                checks: checks
            }

            const statusCode = allChecksPass ? 200 : 503
            this.logger.debug(`Health check completed with status: ${healthStatus.status}`, { checks })
            res.status(statusCode).json(healthStatus)
        } catch (error) {
            this.logger.error('Health check failed', { error: error.message })
            res.status(503).json({
                status: 'DOWN',
                timestamp: new Date().toISOString(),
                service: 'payments',
                error: 'Health check failed',
                details: error.message
            })
        }
    }

    // Check if the basic application is healthy
    isApplicationHealthy() {
        try {
            // Basic checks that the application is functioning
            return process.uptime() > 0 && this.repositories && this.logger
        } catch (error) {
            return false
        }
    }

    // Check Redis connection health
    async checkRedisConnection() {
        try {
            if (!this.repositories.paymentsRepository || !this.repositories.paymentsRepository.client) {
                return 'DOWN'
            }

            const client = this.repositories.paymentsRepository.client
            
            // Try to ping Redis
            await client.ping()
            return 'UP'
        } catch (error) {
            this.logger.warn('Redis health check failed', { error: error.message })
            return 'DOWN'
        }
    }
}

module.exports = (repositories, logger) => {
    const healthController = new HealthController(repositories, logger)
    return healthController.router
}
