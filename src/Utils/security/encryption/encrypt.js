import CryptoJS from "crypto-js"

export const encryption = async({plaintext="" , signature=process.env.CRYPTO_SIG}={})=>{
    const encrypt = CryptoJS.AES.encrypt(plaintext,signature).toString()
    return encrypt
}

export const decrpytion = async({cibertext="" , signature = process.env.CRYPTO_SIG}={})=>{
    const decrypt = CryptoJS.AES.decrypt(cibertext,signature).toString(CryptoJS.enc.Utf8)
    return decrypt
}