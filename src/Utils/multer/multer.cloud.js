import multer from "multer"


export const uploadCloudFile =(fileValidation =[])=>{
    
    const storage = multer.diskStorage({})

    function fileFilter(req,file,cb){
        if (fileValidation.includes(file.mimetype)) {
            cb(null,true)
        }else{
            cb('in-valid file format',false)
        }
    }

    return multer({dest:'dest',fileFilter})
}