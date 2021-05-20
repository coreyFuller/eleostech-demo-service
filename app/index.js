const express = require('express')
const app = express()
const path = require('path');

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM app_user');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

app.use(express.static(path.join(__dirname,"/public")))

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
})

app.get('/messages', (req, res) => {
    res.send("<h1>recieved</h1>")
})

app.get('/authenticate/:token', (req, res) => {
    const token = req.params.token
    const response = require('./responses/authenticate.json')
    res.send(token)
})

app.get('/loads', (req, res) => {
    if(!req.headers.authorization){
        res.send(401, 'Unauthorized due to missing or invalid token and/or API key.')

    }
    else {
        const response = require('./responses/loads.json')
        res.send(response)
    }
})

app.put('/messages', (req, res) => {
    const response = require('./responses/messages.json')
    res.send(response)
})
// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));