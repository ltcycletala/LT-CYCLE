
import mongoose from 'mongoose'

const {Schema} = mongoose

const classPackageSchema = new Schema({
    packageName: {type:String},
    // email: {type:String},
    packagePrice: {type:String},
    packageQuantity: {type:Number},
    packageDuration: {type:Number},
})

const ClassPackage = mongoose.model('ClassPackage', classPackageSchema)
export default ClassPackage

