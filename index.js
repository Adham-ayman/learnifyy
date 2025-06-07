import express from 'express'
import path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({path:path.resolve("./src/Config/.env")})
import bootstrap from './src/app.controller.js'
import { runIo } from './src/Modules/socketio/socket.controller.js'



const app = express()
const port = process.env.PORT

bootstrap(express,app)
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))
runIo(server)