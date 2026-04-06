import { app } from "./app";
const port =process.env.port||3000;
app.listen(port,()=>{
    console.log(`Your Server is running on http:localhost://${port}`)
})