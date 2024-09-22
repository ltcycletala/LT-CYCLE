
import mongoose from 'mongoose'

const {Schema} = mongoose

const newsSchema = new Schema({
    newsTitle: {type:String},
    newsDescription: {type:String},
    image:[{}],
    

})

const News = mongoose.model('News', newsSchema)
export default News

