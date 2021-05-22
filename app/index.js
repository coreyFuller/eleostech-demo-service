const express = require('express')
const app = express()
const path = require('path');
const airtable = require('airtable')
const bodyParser = require('body-parser')
const { Pool, Query } = require('pg');
const json_parser = bodyParser.json()
const jwt = require('jwt-decode');
const { default: jwtDecode } = require('jwt-decode');
const Airtable = require('airtable');
require('dotenv').config()

var base = new Airtable({apiKey: `${process.env.AIRTABLE_APIKEY}`}).base(process.env.AIRTABLE_BASE);


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.static(path.join(__dirname,"/public")))

app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      const results = { 'results': (result) ? result.rows : null};
      res.send(results)
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })

app.get("/", function (req, res) {
  try{
    res.sendFile(path.join(__dirname, '/public/index.html'));
  }
  catch(err) {
    console.log(err)
    res.send("Error " + err);
  }
})

app.get('/messages', async (req, res) => {
  const client = await pool.connect();
  const result = await client.query(`select body from message`)
  res.send(result.rows)
})
app.get('/messages/:handle', async (req, res) => {
  try{
    const client = await pool.connect();
    const result = await client.query(`select body from message where handle='${req.params.handle}'`)
    res.send(`<h1>recieved</h1> <p>${result.rows[0].body}</p>`)
    client.release()
  }
  catch(err){
    console.error(err);
    res.send("Error " + err);
  }
})

app.get('/authenticate/:token', async (req, res) => {
  try{
    const token = req.params.token
    var decoded = jwtDecode(token)
    var users = Object.values(decoded)
    const response = { 
      "api_token" : token,
      "full_name" : users[1]
    }
    res.send(response)
  }
  catch(err){
      console.error(err);
      res.send("Error " + err);
  }
})

app.get('/loads', async (req, res) => {
      try{
        // const client = await pool.connect();
        // const result = await client.query('SELECT * from load')
        // res.send(result.rows)
        // client.release()

        base('Users').find(process.env.AIRTABLE_USER, function(err, record) {
          if (err) { console.error(err); return; }
          console.log('Retrieved', record);
          console.log(record)
          var loads = record._rawJson.fields.Loads
          
          new_loads = []
          for (const i in loads) {
              base('Loads').find(loads[i], async function(err, record) {
                  if (err) { console.error(err); return; }
                  new_loads.push(await record._rawJson.fields)
                  if (new_loads.length == loads.length) res.send(new_loads)
              });
          }
      });
      
    }
      catch(err){
        console.error(err);
        res.send("Error " + err);
      }
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
    client.release()
  }
  catch(err){
    console.error(err);
    res.send("Error " + err);
  }
})

app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));