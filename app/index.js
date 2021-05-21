const express = require('express')
const app = express()
const path = require('path');
const airtable = require('airtable')
const bodyParser = require('body-parser')
const { Pool, Query } = require('pg');
const json_parser = bodyParser.json()
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT api_token FROM app_user');
      const results = { 'results': (result) ? result.rows : null};
      res.send(results)
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

app.get('/messages/:handle', async (req, res) => {
  try{
    const client = await pool.connect();
    const result = await client.query(`select body from message where handle='${req.params.handle}'`)
    console.log(result.rows)
    res.send(`<h1>recieved</h1> <p>${result.rows[0].body}</p>`)
  }
  catch(err){
    console.error(err);
    res.send("Error " + err);
  }
})

app.get('/authenticate/:token', async (req, res) => {
  try{
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM app_user');
    users = result.rows
    const token = req.params.token
    let authorized = false
    let user = {}
    for(let i = 0; i < users.length; i++){
        if(users[i].api_token == token){
            user = users[i]
            authorized = true
            break
        }
    }
    authorized ? res.send(200, user) : res.send(404,"user not found")
  }
  catch(err){
      console.error(err);
      res.send("Error " + err);
  }
})

app.get('/loads', async (req, res) => {
    // if(!req.headers.authorization){
    //     res.send(401, 'Unauthorized due to missing or invalid token and/or API key.')

    // }
    // else {
      try{
        const client = await pool.connect();
        const result = await client.query('SELECT * from load')
        res.send(result.rows)
      }
      catch(err){
        console.error(err);
        res.send("Error " + err);
      }
    // }
})

app.put('/messages/:handle', json_parser, async (req, res) => {
  try{
    const client = await pool.connect();
    const handle = {"handle":req.params.handle}
    const body = req.body
    client.query(`INSERT INTO message (handle, direction, username, message_type, body, composed_at, platform_received_at) 
        VALUES('${handle.handle}', '${body.direction}', '${body.username}', '${body.message_type}', '${body.body}', '${body.composed_at}', '${body.platform_received_at}'
        );`)
    res.send(handle)
  }
  catch(err){
    console.error(err);
    res.send("Error " + err);
  }
})

app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));