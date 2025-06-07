export const create = async ({model,data={}}={})=>{
    const document = await model.create(data)
    return document
}
//FINDERS
export const findOne = async ({model,filter={},select="",populate=[]}={})=>{
    const document = await model.findOne(filter).select(select).populate(populate)
    return document
}
export const findAll = async ({model,filter={},limit=1000,skip=0,select="",populate=[]}={})=>{
    const document = await model.find(filter).select(select).populate(populate).skip(skip).limit(limit)
    return document
}
export const findOneAndUpdate = async ({model,filter={},data={},options={new: true },select="",populate=[]}={})=>{
    const document = await model.findOneAndUpdate(filter,data,options).select(select).populate(populate)
    return document
}
export const findByIdAndUpdate = async ({model,id="",data={},options={ new: true },select="",populate=[]}={})=>{
    const document = await model.findOneAndUpdate({ _id: id },data,options).select(select).populate(populate)
    return document
}
export const findOneAndDelete = async ({model,filter={},select="",populate=[]}={})=>{
    const document = await model.findOneAndDelete(filter).select(select).populate(populate)
    return document
}
export const findByIdAndDelete = async ({model,id="",select="",populate=[]}={})=>{
    const document = await model.findByIdAndDelete(id).select(select).populate(populate)
    return document
}
//UPDATE
export const updateOne = async ({model,filter={},data={},options={new: true }}={})=>{
    const document = await model.updateOne(filter,data,options)
    return document
}
export const updateMany = async ({model,filter={},data={},options={new: true }}={})=>{
    const document = await model.updateMany(filter,data,options)
    return document
}
//DELETE
export const deleteOne = async ({model,filter={}}={})=>{
    const document = await model.deleteOne(filter)
    return document
}
export const deleteMany = async ({model,filter={}}={})=>{
    const document = await model.deleteMany(filter)
    return document
}