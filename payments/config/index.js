let determineConfigDir = () => {
    if(process.env.CONFIG_DIR === undefined || process.env.CONFIG_DIR == null) { 
        return '.'
    }
    return process.env.CONFIG_DIR
}

let determineEnv = () => {
    const defaultEnv = 'development'

    if(process.env.NODE_ENV === undefined || process.env.NODE_ENV == null) {  
        return defaultEnv
    } else if(process.env.NODE_ENV == 'development') {
        return 'development'
    } else if(process.env.NODE_ENV == 'production') {
        return 'production'
    } else {
        return defaultEnv
    }
}

/**
 * Loads configuration from JSON file and applies environment variable overrides
 * Environment variables take precedence over config file values
 * 
 * Supported environment variables:
 * - SERVER_PORT: Override server_port
 * - REDIS_HOST: Override redis_host  
 * - REDIS_PORT: Override redis_port
 * - REDIS_PASSWORD: Override redis_password
 * - LOG_FILE: Override log_file
 * - CONFIG_DIR: Override config directory location
 * - NODE_ENV: Override environment (development/production)
 */
module.exports = function() {
    const config_dir = determineConfigDir()
    const env = determineEnv()
    
    // Load base configuration from file
    let config_data
    try {
        config_data = require(`${config_dir}/config.${env}.json`)
    } catch (error) {
        console.error(`Failed to load config file: ${config_dir}/config.${env}.json`)
        console.error('Using default configuration values')
        // Fallback to default configuration
        config_data = {
            "server_port": 3000,
            "redis_host": "localhost", 
            "redis_port": 6379,
            "redis_password": null,
            "log_file": "./logfile.txt"
        }
    }

    // Apply environment variable overrides
    const config = {
        server_port: parseInt(process.env.SERVER_PORT) || config_data.server_port,
        redis_host: process.env.REDIS_HOST || config_data.redis_host,
        redis_port: parseInt(process.env.REDIS_PORT) || config_data.redis_port,
        redis_password: process.env.REDIS_PASSWORD || config_data.redis_password,
        log_file: process.env.LOG_FILE || config_data.log_file
    }

    // Log configuration source for debugging (excluding sensitive data)
    console.log(`Configuration loaded for environment: ${env}`)
    console.log(`Config directory: ${config_dir}`)
    console.log(`Server port: ${config.server_port} ${process.env.SERVER_PORT ? '(from ENV)' : '(from config file)'}`)
    console.log(`Redis host: ${config.redis_host} ${process.env.REDIS_HOST ? '(from ENV)' : '(from config file)'}`)
    console.log(`Redis port: ${config.redis_port} ${process.env.REDIS_PORT ? '(from ENV)' : '(from config file)'}`)
    console.log(`Redis password: ${config.redis_password ? '[CONFIGURED]' : '[NOT SET]'} ${process.env.REDIS_PASSWORD ? '(from ENV)' : config.redis_password ? '(from config file)' : ''}`)
    console.log(`Log file: ${config.log_file} ${process.env.LOG_FILE ? '(from ENV)' : '(from config file)'}`)

    return config
}