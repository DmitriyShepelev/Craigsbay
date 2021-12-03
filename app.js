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
const AVG_SCORE_QUERY = "SELECT AVG(score) AS avg_score FROM Feedbacks WHERE Feedbacks.item_id = ?";


// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.


/**
 * Get all the items we have in the database.
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
 * Get all of the items from the Items table, along with their average score.
 * @returns {JSONObject} the JSON object representing all the items that we get from
 *                       the table based on searchQuery.
 */
 async function getItemsFromTable() {
  let db = await getDBConnection();
  let dbResult = await db.all("SELECT item_id, quantity, price, category, item_name FROM Items");

  for (let i = 0; i < dbResult.length; i++) {
    let currItemID = dbResult[i].item_id;

    let currAvgScore = await db.get(AVG_SCORE_QUERY, [currItemID]);

    if (!currAvgScore.avg_score) {
      currAvgScore = 5;
    }

    dbResult[i].avg_score = currAvgScore;
  }

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