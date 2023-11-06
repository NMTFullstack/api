import mongoose from "mongoose";
const pointSchema = new mongoose.Schema(
    {
        _id:{
            type: Number,
            required: true,
        },
        name:{
            type: String,
            required: true,
        },
        point: {
            type: Number,
            required: true,
        },
        status: {
            type: Number,
            required: true,
            default:0
        },
    })
