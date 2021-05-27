const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const { Pool, Query } = require('pg');
const json_parser = bodyParser.json()
const { default: jwtDecode } = require('jwt-decode');
const Airtable = require('airtable');
const { resolve } = require('path');
var jwt = require('jwt-simple');
require('dotenv').config()

var base = new Airtable({apiKey: `${process.env.AIRTABLE_APIKEY}`}).base(process.env.AIRTABLE_BASE);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

clean = (obj) => {
  for (var propName in obj) {
    if (obj[propName] === null) {
      obj[propName] = false;
    }
  }
  return obj
}

authenticate = async (token) => {
  var decoded = jwt.decode(token, process.env.SECRET, true, 'HS256')
  var user = await getUserFromAirtable()
  if(user._rawJson.fields.username == decoded.username) return true
  else return false
}

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

getUserFromAirtable = async() => {
  return new Promise((resolve, reject) => {
    base('Users').find(process.env.AIRTABLE_USER, function(err, record) {
      if (err) { console.error(err); return; }
      resolve(record)
  });
  })
}

app.get("/", function (req, res) {
  try{
    res.sendFile(path.join(__dirname, '/public/index.html'));
  }
  catch(err) {
    console.log(err)
    res.send("Error " + err);
  }
})

app.get('/payroll',  async (req, res) => {
  try{
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
    const client = await pool.connect();
    const result = await client.query(`select * from paycheck`)
    var rows = result.rows
    var paychecks = []
    for(x in rows){
      const details = JSON.parse(rows[x].details)
      paychecks.push({check_date: rows[x].check_date, amount : rows[x].amount, details_title : rows[x].details_title, details : details})
    }
    if(paychecks.length > 0) res.send({paychecks : paychecks})
    else res.send({})
  }
  catch(err){
    console.log(err)
    res.send('Error ' + err)
  }
})

app.get('/todos', async(req, res) => {
  try {
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
    const client = await pool.connect();
    const result = await client.query(`select * from todo`)
    client.release()
    const rows = result.rows
    var response = []
    for(x in rows){
      const props = JSON.parse(rows[x].properties)
      response.push({handle: rows[x].handle, type: rows[x].type, due_date: rows[x].due_date, name: rows[x].name, description : rows[x].description, properties: props})
    }
    if (response.length > 0) res.send(response)
    else res.send([])
  }
  catch(err){
    console.log(err)
    res.send('Error ' + err)
  }
})

app.get('/messages', async (req, res) => {
  try{
  const client = await pool.connect();
  const result = await client.query(`select body from message`)
  res.send(result.rows)
  client.release()
  }
  catch(err){
    console.log(err)
    res.send('Error ' + err)
  }
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
    var user = await getUserFromAirtable()
    user = user._rawJson.fields

    var encoded  = jwt.encode({fullname : user.full_name, username: user.username 
    }, process.env.SECRET, 'HS256')

    const response = { 
      full_name : user.full_name,
      api_token : encoded,
      menu_code : user.menu_code,
      dashboard_code : user.dashboard_code,
      custom_settings_form_code : user.custom_settings_form_code,
      username : user.username 
    }
    console.log(response)
    res.send(response)
  }
  catch(err){
      console.error(err);
      res.send("Error " + err);
  }
})


app.get('/truck', async (req, res) => {
  try {
    // if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
    //   res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    // }
    const client = await pool.connect();
    const result = await client.query('select * from mytruck')
    var responses = []
    const rows = result.rows
    for(x in rows){
      responses.push({summary: rows[x].summary, name : rows[x].truck_name, location : rows[x].location})
    }
    console.log(responses[0])
    if(responses.length > 0) res.send(responses[0])
    else res.send({})
  }
  catch(err){
    console.error(err)
    res.send("Error " + err)
  }
})


app.get('/driver_status', async (req, res) => {
  try{
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
    var responses = []
    var hos_list = []
    const client = await pool.connect();
    const query_string = 'select * from driver_status, hours_of_service where driver_status.id = hours_of_service.driver_id'
    const result = await client.query(query_string)
    var rows = result.rows
    for(x in rows){
      hos_list.push({label : rows[x].label, value : rows[x].value, value_type : rows[x].value_type})
    }
    responses.push({driving: rows[x].driving, expires: rows[x].expires, hours_of_service: hos_list})
    console.log(responses[0])
    if(responses.length > 0) res.send(responses[0])
    else res.send({})
    client.release()    
  }
  catch(err) {
    console.log(err)
    res.send("Error " + err)
  }
})

app.get('/loads', async (req, res) => {
  try{ 
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
      const client = await pool.connect();
      var query_string = 'select * FROM load'
      const result = await client.query(query_string)
      var rows = result.rows
      var response = []
      for(x in rows){
        rows[x] = clean(rows[x])
        query_string = `SELECT * FROM stop INNER JOIN load_stop ON stop.id = load_stop.stop_id and load_stop.load_id = '${rows[x].id}';`
        const stop_result = await client.query(query_string)
        var stop_rows = stop_result.rows
        var _stops = []
        for ( i in stop_rows){
          _stops.push({stop_number: stop_rows[i].stop_number, stop_type : stop_rows[i].stop_type, current: stop_rows[i].current, name: stop_rows[i].name, address: stop_rows[i].address, city: stop_rows[i].city, state : stop_rows[i].state, postal_code : stop_rows[i].postal_code, location: stop_rows[i].location, identifiers: stop_rows[i].identifiers})
        }
        response.push({id: rows[x].id, display_identifier : rows[x].display_identifier, sort: rows[x].sort, order_number: rows[x].order_number, load_status: rows[x].load_status, load_status_label : rows[x].load_status_label, active : rows[x].active, current: rows[x].current, trip_planner_enabled: rows[x].trip_planner_enabled, enable_location_updates:rows[x].enable_location_updates, stops : _stops})
      }
      res.send(response)
      client.release()      
    }
    catch(err){
        console.error(err);
        res.send("Error " + err);
      }
})

app.put('/tripchanges/:handle', json_parser, async(req, res) => {
  try{
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
    const handle = req.params.handle
    const body = req.body
    const client = await pool.connect();
    const query_string = `insert into "trip-change" values ('${handle}', '${body.username}', '${body.load_id}', '${body.timestamp}', '${JSON.stringify(body.location)}','${JSON.stringify(body.trip_policy_results)}', '${body.type}', '${JSON.stringify(body.new_location)}',${body.stop_number},'${body.name}','${body.address}','${body.postal_code}','${body.state}', '${body.city}', '${body.crowd_sourced}','${JSON.stringify(body.current_location)}','${body.accuracy}','${body.error_code}', ${body.from_poi})`
    client.query(query_string)
    res.send({handle : handle})
    client.release()
  }
  catch(err){
    console.log(err)
    res.send('Error ' + err)  
  }
})
app.put('/messages/:handle', json_parser, async (req, res) => {
  try{
    if(req.headers.authorization == undefined || !await authenticate(req.headers.authorization.split("=")[1]) ){
      res.send(401, '401 Unauthorized due to missing or invalid token and/or API key.')
    }
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
