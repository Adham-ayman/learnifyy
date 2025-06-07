export const asynchandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch((error) => next(error));
    };
  };

export const globalErrorHandler = (error,req,res,next)=>{
    return res.status(error.cause || 400).json({message :error.message ,stack:error.stack })
}