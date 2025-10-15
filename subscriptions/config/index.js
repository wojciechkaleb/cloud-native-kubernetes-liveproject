let determineConfigDir = () => {
    if(process.env.CONFIG_DIR === undefined || process.env.CONFIG_DIR == null) { 
        return './config'
    }
    return process.env.CONFIG_DIR
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
 */
module.exports = function() {
    const config_dir = determineConfigDir()
    
    // Load base configuration from mounted config file
    let config_data
    try {
        config_data = require(`${config_dir}/subscriptions.config.json`)
    } catch (error) {
		console.error(error)
        console.error(`Failed to load config file: ${config_dir}/subscriptions.config.json - using default configuration`)
        // Fallback to default configuration
        config_data = {
            "server_port": 3001,
            "redis_host": "localhost", 
            "redis_port": 6379,
            "redis_password": null,
            "log_file": "./logfile.txt",
            "payments_service_url": "http://localhost:3000"
        }
    }

    // Apply environment variable overrides (ignore Kubernetes auto-generated vars)
    const config = {
        server_port: parseInt(process.env.SERVER_PORT) || config_data.server_port,
        redis_host: (process.env.REDIS_HOST && !process.env.REDIS_HOST.includes('.')) ? process.env.REDIS_HOST : config_data.redis_host,
        redis_port: parseInt(process.env.REDIS_PORT) || config_data.redis_port,
        redis_password: process.env.REDIS_PASSWORD || config_data.redis_password,
        log_file: process.env.LOG_FILE || config_data.log_file,
        payments_service_url: process.env.PAYMENTS_SERVICE_URL || config_data.payments_service_url
    }

    // Configuration loaded successfully - no need to log here as it will be logged by the service

    return config
}
