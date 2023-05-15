const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
// const corsConfig = {
//   origin: '*',
//   // credentials: true,
//   // methods: ['GET', 'POST', 'PUT', 'DELETE']
// }
// app.use(cors(corsConfig))
// app.options("", cors(corsConfig))
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cnbwwnw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// const verifyJWT=(req,res,next)=>{
//   const authorization = req.headers.authorization;
//   if(!authorization){
//     return res.status(401).send({error:true,message:'unauthorization access'})
//   }
//   const token = authorization.split(' ')[1];
//  jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
//   if(err){
//     return res.status(401).send ({err:true,message:'unauthorization verify '})
//   }
//   req.decoded;
//   next();
//  })
// }
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'});
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
        if(err){
            return res.status(401).send({error: true, message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const carCollection = client.db('carDoctors').collection('servies');
    const cheakOut = client.db('carDoctors').collection('out');
    
    // jwt

    app.post('/jwt',(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN,{
        expiresIn:'1h' });
      console.log(token)
      res.send({token})
    })
    // cars router
    app.get('/cars',async(req,res)=>{
        const id = req.params.id;
        const cursor = carCollection.find();
        const result = await cursor.toArray();
   
        res.send(result)
    });

    app.get('/cars/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const options = {
            projection: { price:1, title: 1, service_id:1 ,img:1},
      
          };
        const result = await carCollection.findOne(query,options);
        res.send(result)
    });


    // out router
    app.get('/out',verifyJWT,  async(req,res)=>{
      const decoded = req.decoded;
      console.log('came back to verify',decoded)

      if(decoded.email !== req.query.email){
        return res.status(403).send({err:1,message:'forbiden access'})
      }
     let query = {}
     if(req.query?.email){
      query = {email:req.query.email}
     }
      const result = await cheakOut.find(query).toArray();
      res.send(result) 
    })

    app.post('/out',async(req,res)=>{
      const cheakout = req.body;
      console.log(cheakout);
      const result = await cheakOut.insertOne(cheakout)
      res.send(result)
    });

    
    app.patch('/out/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
          $set: {
              status: updatedBooking.status
          },
      };
      const result = await cheakOut.updateOne(filter,updateDoc)
      res.send(result)
     
  })
   
       
     
    

    app.delete('/out/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await cheakOut.deleteOne(query);
      res.send(query);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('doctor is runing')
})

app.listen(port,()=>{
    console.log(`server now is running,${port}`)
})