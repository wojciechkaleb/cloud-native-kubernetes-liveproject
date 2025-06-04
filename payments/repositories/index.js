let makeRedisClient = (config) => {

    const redis = require("async-redis")
    const options = {
        host: process.env.REDIS_HOST || config.redis_host,
        port: process.env.REDIS_PORT || config.redis_port,
        password: process.env.REDIS_PASSWORD || config.redis_password
    }

    return redis.createClient(options)
}

module.exports = (config) => {

    const client = makeRedisClient(config)
    const paymentsRepo = require('./PaymentsRepository')(client)

    return {paymentsRepository: paymentsRepo}
}
