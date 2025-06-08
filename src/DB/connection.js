import mongoose from "mongoose";

export const DBconnect = async () => {
    await mongoose
    .connect(`${process.env.DB_URL}`)
    .then(() => {
        console.log("DB connected sucessfully");
    })
    .catch((error) => {
        console.log(error.message);
    });
};
