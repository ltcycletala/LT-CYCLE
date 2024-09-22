import express from 'express'


import News from '../models/newsModels.js';

import { cloudinaryDeleteOneFile, cloudinaryUploadFiles } from '../helpers/cloudinaryConfig.js';
import { upload } from '../helpers/multer.js';

const newsRouter = express.Router()

/* news se refiere a noticias */

newsRouter.post('/', upload, async(req,res)=>{
    console.log('endpint crear news')

    try {
        
        const files = req.files

        console.log(files)

        const newNews = new News(req.body)
        
        const cloudinaryResult = await cloudinaryUploadFiles(files, 'fravelar/newsImages')

        newNews.image = cloudinaryResult

        await newNews.save()
        console.log('fin')
        res.json({message:'Noticia Guardado Exitosamente'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }

})


newsRouter.get('/', async(req,res)=>{
    console.log('endpoint get all news')
    try {

        const news = await News.find()

        res.json(news)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})



newsRouter.get('/:newsId', async(req,res)=>{
    console.log('endpint get single instructor')
    try {

        const {newsId} = req.params

        const isNewsInDb = await News.findById(newsId)

        res.json(isNewsInDb)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


newsRouter.put('/:newsId', async(req,res)=>{
    console.log('endpoint edit an instructor')
    try {

        const {newsId} = req.params

        console.log(req.body)

        await News.findByIdAndUpdate(newsId , {...req.body})

        res.json({message:'Noticia Actualizada'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})




newsRouter.delete('/:newsId', async(req,res)=>{
    console.log('endpoint delete instructor')
    try {

        const {newsId} = req.params

        const isNewsInDb = await News.findByIdAndDelete(newsId)

        if(!isNewsInDb){
            return res.status(404).json({message:'Noticias no existe en base de datos'})
        }

        for(const item of isNewsInDb.image){
            await cloudinaryDeleteOneFile(item.cloudinary_id)
        }

        
        res.json({message:'Noticia eliminada'})
        

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})



newsRouter.patch('/:newsId', upload, async(req,res)=>{
    console.log('endpoint edit image of instructor')

    try {


        const files = req.files
        const {newsId} = req.params

        // 1. finding instructor, 2.saving new image, 3.pulling old image from database
        const newsUpdateImage = await News.findById(newsId)
        const cloudinaryResult = await cloudinaryUploadFiles(files, 'fravelar/newsImages')
        const getImageToDeleteFromDb = newsUpdateImage.image.pop()

        // 4.deleting the image from cloudinary (the server for files)
        if(getImageToDeleteFromDb?.cloudinary_id){
            await cloudinaryDeleteOneFile(getImageToDeleteFromDb.cloudinary_id)
        }

        //5. updating and saving data(reference of new image in cloudinary to show) in the database
        newsUpdateImage.image = [...cloudinaryResult]
        await newsUpdateImage.save()

        res.send({message:'Imagen editada'})

        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


export default newsRouter