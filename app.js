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
const FULL_SCORE = 5;
const AVG_SCORE_QUERY = "SELECT AVG(score) AS avg_score FROM Feedbacks WHERE item_id = ?";
const GET_ITEM_FEEDBACK_QUERY = "SELECT user_name, score, feedback_text " +
    "FROM Feedbacks WHERE item_id = ?";

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
    res.type("text");
    res.status(SERVER_ERROR_NUM).send("An error occurred on the server. Try again later.");
  }
});

/**
 * Get all of the item ids that match the search query.
 */
app.get("/search/:query", async (req, res) => {
  try {
    let searchQuery = req.params.query;
    let resultItems = await getItemsBySearchQuery(searchQuery);
    res.json(resultItems);
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR_NUM).send("An error occurred on the server. Try again later.");
  }
});

/**
 * Get whether or not the login information has the right user name and the right password.
 * Returns True id
 */
app.post("/login", async (req, res) => {
  try {
    if (req.body.user && req.body.password) {
      let db = await getDBConnection();
      let getUserInfoQuery = "SELECT user_name, user_password FROM Accounts WHERE user_name = ?";
      let dbResult = await db.get(getUserInfoQuery, req.body.user);
      await db.close();

      if (dbResult) {
        res.json(dbResult["user_password"] === req.body.password);
      } else {
        res.json(false);
      }
    } else {
      res.type("text");
      res.status(REQUEST_ERROR_NUM).send("Missing one or more of the required parameters.");
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR_NUM).send("An error occurred on the server. Try again later.");
  }
});

/**
 * Get the more detailed information about an item specified by the "itemID".
 */
app.get("/item/:itemID", async (req, res) => {
  try {
    let itemID = req.params.itemID;
    let resultItem = await getItemFromTable(itemID);

    if (!resultItem) {
      res.type("text");
      res.status(REQUEST_ERROR_NUM).send("Item with id of " + itemID + " does not exist.");
    } else {
      res.json(resultItem);
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR_NUM).send("An error occurred on the server. Try again later.");
  }
});

app.post('/createaccount', async (req, res) => {
  res.type('text').send('true');
})

/**
 * Get all of the items from the Items table, along with their average score.
 * @returns {JSONObject} the JSON array representing all of the items that we get from
 *                       the Items table.
 */
async function getItemsFromTable() {
  let db = await getDBConnection();
  let dbResult = await db.all("SELECT item_id, quantity, price, category, item_name FROM Items");

  for (let i = 0; i < dbResult.length; i++) {
    dbResult[i]["avg_score"] = await getAverageScore(dbResult[i].item_id);
  }

  await db.close();
  return dbResult;
}

/**
 * Get the item ids of the items where the name of the item matches the "searchQuery"
 * @param {String} searchQuery - the search query we are getting the item id
 * @returns {JSONObject} the JSON object representing all of the ids that we get from
 *                       the table that matches the searchQuery
 */
async function getItemsBySearchQuery(searchQuery) {
  let db = await getDBConnection();
  let dbQuery = "SELECT item_id FROM Items WHERE item_name LIKE '%" + searchQuery + "%'";
  let dbResult = await db.all(dbQuery);

  let itemIdArr = [];

  for (let i = 0; i < dbResult.length; i++) {
    itemIdArr.push(dbResult[i]["item_id"]);
  }

  await db.close();
  return itemIdArr;
}

/**
 * Get more detailed information about an item from Items table, with an id specified by "itemID".
 * Return undefined if no item with id of "itemID" exists in the table.
 * @param {Number} itemID - the item id of the item that we want to get more information from
 * @returns {JSONObject} the JSON object representing an item with an id itemID, along with
 *                       the feedbacks of the users for that item. If there is no item with id of
 *                       "itemID", undefined is returned.
 */
async function getItemFromTable(itemID) {
  let db = await getDBConnection();
  let oneItemInfo = await db.get("SELECT * FROM Items WHERE item_id = ?", [itemID]);

  if (oneItemInfo) {
    oneItemInfo["avg_score"] = await getAverageScore(itemID);
    oneItemInfo["feedbacks"] = await db.all(GET_ITEM_FEEDBACK_QUERY, [itemID]);
  }

  db.close();
  return oneItemInfo;
}

/**
 * Get the average user score of an item with an item id of "itemID". Returns full score (5) if
 * an item doesn't have any user score.
 * @param {Number} itemID - the item id of the item that we want to get the average user score from
 * @returns {Number} the average user score of an item, or 5 if there is no user score yet for
 *                   current item with an id of "itemID"
 */
async function getAverageScore(itemID) {
  let db = await getDBConnection();
  let avgScore = await db.get(AVG_SCORE_QUERY, [itemID]);

  if (!avgScore["avg_score"]) {
    avgScore["avg_score"] = FULL_SCORE;
  }

  db.close();
  return avgScore["avg_score"];
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