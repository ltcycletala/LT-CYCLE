import express from 'express'
import cors from 'cors'
import "dotenv/config"
import mongoose from 'mongoose'

import Stripe from 'stripe'

const server = express()

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());


const stripe = new Stripe(process.env.STRIKE_KEY_SECRET)

import userRouter from './routes/userRoutes.js'
import instructorRourter from './routes/instructorRoutes.js'
import classPackageRouter from './routes/classPackageRoutes.js'
import newsRouter from './routes/newsRoutes.js.js'
import classScheduleRouter from './routes/classScheduleRoutes.js'
import cronRouter from './routes/cronRoute.js'



server.use('/api/cron', cronRouter)

server.use('/api/users', userRouter)
server.use('/api/instructors', instructorRourter)
server.use('/api/class-package', classPackageRouter)
server.use('/api/news', newsRouter)
server.use('/api/class-schedule', classScheduleRouter)


mongoose.set("strictQuery", false);
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Data Base Connected"))
	.catch((err) => console.log(err));



server.post('/api/checkout', async(req,res)=>{

	try {

		const payment = await stripe.paymentIntents.create({
			amount: req.body.amount,
			currency: 'MXN',

			description: 'class package',
			automatic_payment_methods:{enabled:true}
		})

		res.send({clientSecret: payment.client_secret})
		
	} catch (error) {
		console.log(error)
	}

})

console.log(process.env.EMAIL_HOST)
const PORT = 9000 || process.env.PORT;
server.listen(PORT, () => {
	console.log("server running");
});
