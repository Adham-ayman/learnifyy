import multer from "multer"
import path from "node:path"
import fs from "node:fs"
export const fileValidationTypes ={
    image:['image/jpg','image/jpeg','image/png'],
    video:['video/mp4', 'video/mkv', 'video/webm'],
    text:['text'],
    mix: ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4', 'video/mkv', 'video/webm']
}

export const uploadDiskFile =(customPath="general",fileValidation =[])=>{
    const basePath = `Uploads/${customPath}`
    const fullPath = path.resolve(`./src/${basePath}`)
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath,{recursive:true})
    }
    

    const storage = multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,fullPath)
        },
        filename:(req,file,cb)=>{
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + file.originalname
            file.finalPath =baseUrl +"/"+uniqueSuffix + '_' + file.originalname
            cb(null,uniqueSuffix + '_' + file.originalname)
        }
    })

    function fileFilter(req,file,cb){
        console.log(file.mimetype);
        
        if (fileValidation.includes(file.mimetype)) {
            cb(null,true)
        }else{
            cb('in-valid file format',false)
        }
    }

    return multer({dest:'defaultUpload',fileFilter,storage})
}