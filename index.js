const express = require('express')
const app = express()

// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})

app.get('/messages', (req, res) => {
    res.send("<h1>recieved</h1>")
})

app.get('/authenticate/', (req, res) => {
    res.send("<h1>recieved</h1>")
})

app.get('/loads', (req, res) => {
    res.send("<h1>recieved</h1>")

})

app.post('/messages', (req, res) => {
    res.send("<h1>recieved</h1>")
})
// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));