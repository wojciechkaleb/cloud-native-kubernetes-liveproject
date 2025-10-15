let makeRedisClient = (config) => {

    const redis = require("async-redis")
    const options = {
        host: config.redis_host,
        port: config.redis_port
    }

    // Only add password if it's not null or undefined
    if (config.redis_password !== null && config.redis_password !== undefined) {
        options.password = config.redis_password
    }

    return redis.createClient(options)
}

module.exports = (config) => {

    const client = makeRedisClient(config)
    const paymentsRepo = require('./PaymentsRepository')(client)

    return {paymentsRepository: paymentsRepo}
}
