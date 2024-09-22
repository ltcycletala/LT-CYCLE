import express from 'express'


import Instructor from '../models/instructorModels.js';

import { cloudinaryDeleteOneFile, cloudinaryUploadFiles } from '../helpers/cloudinaryConfig.js';
import { upload } from '../helpers/multer.js';

const instructorRourter = express.Router()


instructorRourter.post('/', upload, async(req,res)=>{
    console.log('endpint crear instructor')

    try {
        
        const files = req.files

        console.log(files)

        const newInstructor = new Instructor(req.body)
        
        const cloudinaryResult = await cloudinaryUploadFiles(files, 'fravelar/instructorImages')

        newInstructor.image = cloudinaryResult

        await newInstructor.save()
        console.log('fin')
        res.json({message:'Instructor Guardado Exitosamente'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }

})


instructorRourter.get('/', async(req,res)=>{
    console.log('endpoint get all instructor')
    try {

        const instructor = await Instructor.find()

        res.json(instructor)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})



instructorRourter.get('/:instructorId', async(req,res)=>{
    console.log('endpint get single instructor')
    try {

        const {instructorId} = req.params

        const isInstructorInDb = await Instructor.findById(instructorId)

        res.json(isInstructorInDb)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


instructorRourter.put('/:instructorId', async(req,res)=>{
    console.log('endpoint edit an instructor')
    try {

        const {instructorId} = req.params

        console.log(req.body)

        await Instructor.findByIdAndUpdate(instructorId , {...req.body})

        res.json({message:'Instructor Actualizado'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})




instructorRourter.delete('/:instructorId', async(req,res)=>{
    console.log('endpoint delete instructor')
    try {

        const {instructorId} = req.params

        const isIntrusctor = await Instructor.findByIdAndDelete(instructorId)

        if(!isIntrusctor){
            return res.status(404).json({message:'Instructor no existe en base de datos'})
        }

        for(const item of isIntrusctor.image){
            await cloudinaryDeleteOneFile(item.cloudinary_id)
        }

        
        res.json({message:'Instructor eliminado'})
        

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})



instructorRourter.patch('/:instructorId', upload, async(req,res)=>{
    console.log('endpoint edit image of instructor')

    try {


        const files = req.files
        const {instructorId} = req.params

        // 1. finding instructor, 2.saving new image, 3.pulling old image from database
        const instructorUpdateImage = await Instructor.findById(instructorId)
        const cloudinaryResult = await cloudinaryUploadFiles(files, 'fravelar/instructorImages')
        const getImageToDeleteFromDb = instructorUpdateImage.image.pop()

        // 4.deleting the image from cloudinary (the server for files)
        if(getImageToDeleteFromDb?.cloudinary_id){
            await cloudinaryDeleteOneFile(getImageToDeleteFromDb.cloudinary_id)
        }

        //5. updating and saving data(reference of new image in cloudinary to show) in the database
        instructorUpdateImage.image = [...cloudinaryResult]
        await instructorUpdateImage.save()

        res.send({message:'Imagen editada'})

        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
})


export default instructorRourter