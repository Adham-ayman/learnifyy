import bcrypt from 'bcrypt'

export const hashing = async({pass="" , salt = parseInt(process.env.SALT_ROUND)}={})=>{
    const hash = bcrypt.hashSync(pass,salt)
    return hash
}

export const comparehash = async({pass="" , hashedvalue = ""}={})=>{
    const match = bcrypt.compareSync(pass,hashedvalue)
    return match
}