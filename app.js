/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC
 * This is the JavaScript to support the Craigsbay website and API. With a GET
 * request, users can retrieve all items, details about a specific item, items
 * matching a search query, and a transaction history. With a POST request,
 * users can submit feedback, buy an item, create an account, and verify login
 * information.
 */

'use strict';

const express = require('express');

const multer = require('multer');

const sqlite3 = require('sqlite3');

const sqlite = require('sqlite');

const app = express();

const SPECIFIED_PORT = 8000;

const SERVER_ERROR_NUM = 500;

const REQUEST_ERROR_NUM = 400;

const FULL_SCORE = 5;

const MISSING_PARAMS = 'At least one POST parameter is missing.';

const AVG_SCORE_QUERY = 'SELECT AVG(score) AS avg_score FROM Feedbacks WHERE item_id = ?;';

const GET_ITEM_FEEDBACK_QUERY = 'SELECT user_name, score, feedback_text ' +
    'FROM Feedbacks WHERE item_id = ?;';

const UPDATE_QUANTITY = 'UPDATE Items SET quantity = ? WHERE item_id = ?;';

const GET_BALANCE = 'SELECT balance FROM Accounts WHERE user_name = ?;';

const CREATE_TXN = 'INSERT INTO Transactions (\'user_name\', \'item_id\', \'total_price\',' +
                   '\'quantity\') VALUES (?, ?, ?, ?);';

const UPDATE_BALANCE = 'UPDATE Accounts SET balance = ? WHERE user_name = ?;';

const SERVER_ERROR_MSG = 'An error occurred on the server. Try again later.';

const CREATE_FEEDBACK = 'INSERT INTO Feedbacks (\'item_id\', \'user_name\', \'score\',' +
  ' \'feedback_text\') VALUES (?, ?, ?, ?);';

const GET_PRICE = 'SELECT price FROM Items WHERE item_id = ?';

const GET_ACCOUNTS = 'SELECT * FROM Accounts WHERE user_name = ?;';

const GET_ITEM = 'SELECT * FROM Items WHERE item_id = ?;';

// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.

/**
 * Gets every item.
 */
app.get('/items', async (req, res) => {
  try {
    let resultItems = await getItemsFromTable();
    res.json(resultItems);
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Gets all of the item ids that match the search query.
 */
app.get('/search/:query', async (req, res) => {
  try {
    let resultItems = await getItemsBySearchQuery(req.params.query);
    res.json(resultItems);
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Verifies the user's username and password.
 */
app.post('/login', async (req, res) => {
  try {
    if (req.body.user && req.body.password) {
      let db = await getDBConnection();
      let getUserInfoQuery = 'SELECT user_name, user_password FROM Accounts WHERE user_name = ?';
      let dbResult = await db.get(getUserInfoQuery, [req.body.user]);
      db.close();
      if (dbResult) {
        res.json(dbResult['user_password'] === req.body.password);
      } else {
        res.json(false);
      }
    } else {
      res.type('text').status(REQUEST_ERROR_NUM)
        .send(MISSING_PARAMS);
    }
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Get detailed information about an item specified by its id "itemID".
 */
app.get('/item/:itemID', async (req, res) => {
  try {
    let itemID = req.params.itemID;
    let resultItem = await getItemFromTable(itemID);
    if (!resultItem) {
      res.type('text').status(REQUEST_ERROR_NUM)
        .send('Item #' + itemID + ' does not exist.');
    } else {
      res.json(resultItem);
    }
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Creates an account with a username, password, and email.
 */
app.post('/createaccount', async (req, res) => {
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.type('text').status(REQUEST_ERROR_NUM)
      .send(MISSING_PARAMS);
  } else {
    try {
      let db = await getDBConnection();
      let dbResult = await db.get(GET_ACCOUNTS, [req.body.username]);
      if (dbResult) {
        db.close();
        res.type('text').status(REQUEST_ERROR_NUM)
          .send(req.body.username + ' already exists.');
      } else {
        await db.run('INSERT INTO Accounts (\'user_name\', \'user_password\', \'email\')' +
                     ' VALUES (?, ?, ?);', [req.body.username, req.body.password, req.body.email]);
        db.close();
        res.type('text').send('Success!');
      }
    } catch (error) {
      res.type('text').status(SERVER_ERROR_NUM)
        .send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Allows a user to buy an item.
 */
app.post('/buy/:itemID/:username/:quantity', async (req, res) => {
  try {
    let db = await getDBConnection();
    let itemID = req.params.itemID;
    let quantity = req.params.quantity;
    let username = req.params.username;
    let currQuantity = await db.get('SELECT quantity FROM Items WHERE item_id = ?;', [itemID]);
    let balance = await db.get(GET_BALANCE, [username]);
    let price = await db.get(GET_PRICE, [itemID]);
    let errResult = handleTransactErrors(currQuantity, quantity, balance, price, itemID, username);
    if (errResult !== '') {
      db.close();
      res.type('text').status(REQUEST_ERROR_NUM)
        .send(errResult);
    } else {
      await db.run(UPDATE_QUANTITY, [currQuantity.quantity - quantity, itemID]);
      balance = await transact(db, username, itemID, price.price, balance.balance, quantity);
      res.type('text').send('' + balance);
    }
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Get a user's transactions.
 */
app.get('/transactions/:username', async (req, res) => {
  try {
    let db = await getDBConnection();
    let transactions = await db.all('SELECT transaction_id, item_id, ' +
      ' total_price, transaction_date FROM Transactions WHERE user_name = ?' +
      ' ORDER BY DATETIME(transaction_date) DESC;', [req.params.username]);
    db.close();
    res.json(transactions);
  } catch (error) {
    res.type('text').status(SERVER_ERROR_NUM)
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Submit feedback containing the username, score, and feedback text.
 */
app.post('/feedback', async (req, res) => {
  if (!req.body.username || !req.body.score || !req.body.description || !req.body.id) {
    res.type('text').status(REQUEST_ERROR_NUM)
      .send(MISSING_PARAMS);
  } else {
    try {
      let db = await getDBConnection();
      let userExists = await db.get(GET_ACCOUNTS, [req.body.username]);
      let itemExists = await db.get(GET_ITEM, [req.body.id]);
      if (!userExists || !itemExists) {
        db.close();
        res.type('text').status(REQUEST_ERROR_NUM)
          .send('Your username or item ID does not exist.');
      } else {
        await db.run(CREATE_FEEDBACK, [req.body.id, req.body.username,
          req.body.score, req.body.description]);
        db.close();
        res.type('text').send('Success!');
      }
    } catch (error) {
      res.type('text').status(SERVER_ERROR_NUM)
        .send(SERVER_ERROR_MSG);
    }
  }
});

/**
  * Handles transaction errors.
  * @param {object} currQuantity the current quantity of the item to buy.
  * @param {number} quantity the quantity requested to buy.
  * @param {object} balance the buyer's money balance.
  * @param {object} price the price of the item to buy.
  * @param {number} itemID the id of the item to buy.
  * @param {string} username the buyer's username.
  * @returns {string} representing the error, if there is one; otherwise, an empty string
  * representing no error.
  */
 function handleTransactErrors(currQuantity, quantity, balance, price, itemID, username) {
  if (!currQuantity) {
    return 'Item #' + itemID + ' does not exist.';
  } else if (currQuantity.quantity < quantity) {
    return 'You requested to buy ' + quantity + ' items but only ' + currQuantity.quantity +
           ' is available.';
  } else if (!balance) {
    return username + ' is not a valid user.';
  } else if (balance.balance < price.price * quantity) {
    return 'You only have Ɖ' + balance.balance + ' but ' + quantity + 'item(s) with ID ' + itemID +
           ' cost(s) Ɖ' + price.price * quantity + '.';
  }
  return '';
}

/**
 * Completes a transaction by logging the transaction and updates the user's balance.
 * @param {object} db the database object.
 * @param {string} username the username.
 * @param {number} itemID the item ID.
 * @param {number} price the item's price.
 * @param {number} balance the user's balance before the transaction.
 * @param {number} quantity the quantity of items bought.
 * @returns {number} the balance representing the user's balance after the transaction.
 */
async function transact(db, username, itemID, price, balance, quantity) {
  await db.run(CREATE_TXN, [username, itemID, quantity * price, quantity]);
  await db.run(UPDATE_BALANCE, [balance - quantity * price, username]);
  let userBalance = await db.get(GET_BALANCE, [username]);
  db.close();
  return userBalance.balance;
}

/**
 * Get all of the items from the Items table, along with their average score.
 * @returns {object} the JSON array representing all of the items that we get from
 *                   the Items table.
 */
async function getItemsFromTable() {
  let db = await getDBConnection();
  let dbResult = await db.all('SELECT item_id, quantity, price, category, item_name FROM Items;');
  for (let i = 0; i < dbResult.length; i++) {
    dbResult[i]['avg_score'] = await getAverageScore(dbResult[i].item_id);
  }
  await db.close();
  return dbResult;
}

/**
 * Get the item ids of the items where the name of the item matches the "searchQuery"
 * @param {string} searchQuery the search query we are getting the item id
 * @returns {object} the JSON object representing all of the ids that we get from
 *                       the table that matches the searchQuery
 */
async function getItemsBySearchQuery(searchQuery) {
  let db = await getDBConnection();
  let dbQuery = 'SELECT item_id FROM Items WHERE item_name LIKE \'%' + searchQuery + '%\'';
  let dbResult = await db.all(dbQuery);
  let itemIdArr = [];
  for (let i = 0; i < dbResult.length; i++) {
    itemIdArr.push(dbResult[i]['item_id']);
  }
  await db.close();
  return itemIdArr;
}

/**
 * Get more detailed information about an item from Items table, with an id specified by "itemID".
 * Return undefined if no item with id of "itemID" exists in the table.
 * @param {number} itemID - the item id of the item that we want to get more information from
 * @returns {object} the JSON object representing an item with an id itemID, along with
 *                       the feedbacks of the users for that item. If there is no item with id of
 *                       "itemID", undefined is returned.
 */
async function getItemFromTable(itemID) {
  let db = await getDBConnection();
  let oneItemInfo = await db.get('SELECT * FROM Items WHERE item_id = ?', [itemID]);
  if (oneItemInfo) {
    oneItemInfo['avg_score'] = await getAverageScore(itemID);
    oneItemInfo['feedbacks'] = await db.all(GET_ITEM_FEEDBACK_QUERY, [itemID]);
  }
  db.close();
  return oneItemInfo;
}

/**
 * Get the average user score of an item with an item id of "itemID". Returns full score (5) if
 * an item doesn't have any user score.
 * @param {number} itemID the item id of the item that we want to get the average user score from.
 * @returns {number} the average user score of an item or 5 if there is no user score yet for
 *                   current item with an id of "itemID"
 */
async function getAverageScore(itemID) {
  let db = await getDBConnection();
  let avgScore = await db.get(AVG_SCORE_QUERY, [itemID]);
  if (!avgScore['avg_score']) {
    avgScore['avg_score'] = FULL_SCORE;
  }
  db.close();
  return avgScore['avg_score'];
}

/**
 * Establishes a database connection to the database and returns the database
 * object. Any errors that occur should be caught in the function that calls this
 * one.
 * @returns {object} the database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'backend_db.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || SPECIFIED_PORT;
app.listen(PORT);