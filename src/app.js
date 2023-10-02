require("dotenv").config();
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const ticketsRoutes = require('./routes/tickets')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())

app.use('/tickets', ticketsRoutes.router)

exports.app = app
