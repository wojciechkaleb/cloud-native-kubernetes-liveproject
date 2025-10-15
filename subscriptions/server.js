const bodyParser = require("body-parser")
const express = require("express")
const pino = require('pino')

const config = require("./config")()

const consoleOutputLevel = process.env.LOG_LEVEL || 'info'
const logger = pino({
    transport: {
        targets: [
            { level: 'info', target: 'pino-pretty', options: { destination: config.log_file } },
            { level: consoleOutputLevel, target: 'pino-pretty'} ,
        ],
    }
})

const app = express();

app.use(bodyParser.json());

const loadRepositories = require("./repositories")
const loadControllers = require("./controllers")

const repositories = loadRepositories(config)
loadControllers(app, repositories, logger, config)

const server_port = config.server_port
app.listen(server_port, () => {
    logger.info(`Subscription service is running on port ${server_port}.`)
})
