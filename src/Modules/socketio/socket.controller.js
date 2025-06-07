import { Server } from "socket.io"
import { logoutSocket, registerSocket } from "./service/auth.socket.service.js"



let io = undefined

export const runIo=async(server)=>{
     io = new Server(server,{
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
          }
    })
    return io.on("connection" , async (socket)=>{
        console.log("New client connected:", socket.handshake.auth);   
        await registerSocket(socket)
        await logoutSocket(socket)
    })
}

export const getIo=()=>{
    return io
}