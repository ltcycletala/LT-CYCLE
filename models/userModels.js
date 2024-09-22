import mongoose from 'mongoose'

const {Schema} = mongoose

const userSchema = new Schema({
    name: {type:String},
    email: {type:String},
    password: {type:String},
    role:{type:String, default:'user'}, //admin / user
    token: { type: String },
    tusClases:{
      
    },
    isVerified: { type: Boolean, default: false },

})

const User = mongoose.model('User', userSchema)
export default User

