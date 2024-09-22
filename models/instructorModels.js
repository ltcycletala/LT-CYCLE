
import mongoose from 'mongoose'

const {Schema} = mongoose

const instructorSchema = new Schema({
    instructorName: {type:String},
    description: {type:String},
    image:[{}],
    

})

const Instructor = mongoose.model('Instructor', instructorSchema)
export default Instructor

