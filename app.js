/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC and TODO: Add Jim's section.
 * TODO: Add comments.
 */

"use strict";

const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const app = express();

const SPECIFIED_PORT = 8000;
const SERVER_ERROR_NUM = 500;
const REQUEST_ERROR_NUM = 400;


// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.


/**
 * Get all the items we have in the database if 
 * Otherwise, get all of the yips with a text that contains the value associated with
 * the "search" query paramter.
 */
app.get("/items", async (req, res) => {
  try {
    let resultItems = await getItemsFromTable();
    res.json(resultItems);
  } catch (err) {
    console.log(err);
    res.type("text");
    res.status(SERVER_ERROR_NUM).send("An error occurred on the server. Try again later.");
  }
});


/**
 * Get all of the items from the Items table.
 * @returns {JSONObject} the JSON object representing all the yips that we get from
 *                       the table based on searchQuery.
 */
 async function getItemsFromTable() {
  let db = await getDBConnection();
  let dbResult = await db.all("SELECT * FROM Items");

  await db.close();
  return dbResult;
}


/**
 * Establishes a database connection to the database and returns the database
 * object. Any errors that occur should be caught in the function that calls this
 * one
 * @returns {object} the database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "backend_db.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || SPECIFIED_PORT;
app.listen(PORT);