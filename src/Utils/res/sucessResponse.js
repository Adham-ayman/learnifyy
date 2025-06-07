export const sucessResponse = async ({res,message="done",status=200,data={}}={})=>{
    return res.status(status).json({message:message ,data:data}) 
}