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

const cookieParser = require('cookie-parser');

const express = require('express');

const multer = require('multer');

const sqlite3 = require('sqlite3');

const sqlite = require('sqlite');

const bcrypt = require('bcrypt');

const app = express();

const SPECIFIED_PORT = 8000;

const SERVER_ERROR_NUM = 500;

const REQUEST_ERROR_NUM = 400;

const FULL_SCORE = 5;

const MISSING_PARAMS = 'At least one POST parameter is missing.';

const GET_TRANSACTIONS = 'SELECT item_name, transaction_id, Items.item_id, ' +
            ' total_price, transaction_date FROM Transactions, Items WHERE user_name = ?' +
            ' AND Items.item_id = Transactions.item_id ORDER BY ' +
            'DATETIME(transaction_date) DESC;';

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

const GET_USER_INFO = 'SELECT user_name, user_password, balance' +
                      ' FROM Accounts WHERE user_name = ?;';

const ADD_ACCOUNT = 'INSERT INTO Accounts (\'user_name\', \'user_password\', \'email\')' +
                    ' VALUES (?, ?, ?);';

const GET_QUANTITY = 'SELECT quantity FROM Items WHERE item_id = ?;';

const GET_ITEMS = 'SELECT item_id, quantity, price, category, item_name FROM Items;';

const GET_ITEMS_BY_SEARCH_QUERY = 'SELECT item_id FROM Items WHERE item_name LIKE ?' +
    ' OR description LIKE ? OR category LIKE ?;';

const GET_ONE_ITEM = 'SELECT * FROM Items WHERE item_id = ?;';

// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.

app.use(cookieParser());

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
      let dbResult = await db.get(GET_USER_INFO, [req.body.user]);
      await db.close();
      if (dbResult && await bcrypt.compare(req.body.password, dbResult['user_password'])) {
        res.json(dbResult.balance);
      } else {
        res.json(-1);
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
        await db.close();
        res.type('text').status(REQUEST_ERROR_NUM)
          .send(req.body.username + ' already exists.');
      } else {
        const salt = await bcrypt.genSalt();
        await db.run(ADD_ACCOUNT, [req.body.username, await bcrypt.hash(req.body.password, salt),
          req.body.email]);
        let userBalance = await db.get(GET_BALANCE, [req.body.username]);
        await db.close();
        res.json(userBalance.balance);
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
app.post('/buy', async (req, res) => {
  if (!req.body.id || !req.body.user || !req.body.quantity) {
    res.type('text').status(REQUEST_ERROR_NUM)
      .send(MISSING_PARAMS);
  }
  try {
    let db = await getDBConnection();
    let itemID = req.body.id;
    let quantity = req.body.quantity;
    let username = req.body.user;
    let currQuantity = await db.get(GET_QUANTITY, [itemID]);
    let balance = await db.get(GET_BALANCE, [username]);
    let price = await db.get(GET_PRICE, [itemID]);
    let qnty = [currQuantity, quantity];
    let errResult = handleTransactErrors(qnty, balance, price, itemID, username, req.cookies.user);
    if (errResult !== '') {
      await db.close();
      res.type('text').status(REQUEST_ERROR_NUM)
        .send(errResult);
    } else {
      await db.run(UPDATE_QUANTITY, [currQuantity.quantity - quantity, itemID]);
      res.json(await transact(db, username, itemID, price.price, balance.balance, quantity));
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
  if (!req.cookies.user) {
    res.type('text').status(REQUEST_ERROR_NUM)
      .send('You are not logged in.');
  } else {
    try {
      let db = await getDBConnection();
      let transactions = await db.all(GET_TRANSACTIONS, [req.params.username]);
      await db.close();
      res.json(transactions);
    } catch (error) {
      res.type('text').status(SERVER_ERROR_NUM)
        .send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Submit feedback containing the username, score, and feedback text.
 */
app.post('/feedback', async (req, res) => {
  res.type('text');
  let username = req.body.username;
  if (!username || !req.body.score || !req.body.id) {
    res.status(REQUEST_ERROR_NUM).send(MISSING_PARAMS);
  } else {
    try {
      let db = await getDBConnection();
      let userExists = await db.get(GET_ACCOUNTS, [username]);
      let itemExists = await db.get(GET_ITEM, [req.body.id]);
      let user = req.cookies.user;
      let errResult = handleFeedbackErrors(userExists, username, itemExists, req.body.id, user);
      if (errResult !== '') {
        await db.close();
        res.status(REQUEST_ERROR_NUM).send(errResult);
      } else {
        await db.run(CREATE_FEEDBACK, [req.body.id, username,
          req.body.score, (req.body.description ? req.body.description : '')]);
        await db.close();
        res.send('Success!');
      }
    } catch (error) {
      res.status(SERVER_ERROR_NUM).send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Handles errors related to submitting feedback.
 * @param {object} userExists not null/undefined iff the user
 * submitting the feedback exists.
 * @param {string} username the username of the user submitting feedback.
 * @param {object} itemExists not null/undefined iff the item for which
 * the user is submitting a feedback exists.
 * @param {number} itemID the ID of the item to leave feedback on.
 * @param {object} loggedIn not null/undefined iff the user seeking
 * to submit feedback is logged in.
 * @returns {string} representing the error, if one exists; otherwise, returns an empty string.
 */
function handleFeedbackErrors(userExists, username, itemExists, itemID, loggedIn) {
  if (!loggedIn) {
    return 'You are not logged in.';
  } else if (!userExists) {
    return username + ' is not a valid username.';
  } else if (!itemExists) {
    return 'There is no valid item with ID ' + itemID + '.';
  }
  return '';
}

/**
 * Handles errors related to completing a transaction.
 * @param {object} quantity the quantity of the item to purchase and the
 * quantity of items requested to purchase.
 * @param {object} balance the user's balance.
 * @param {price} price the item's price.
 * @param {number} itemID the item's ID.
 * @param {string} username the user's username.
 * @param {object} loggedIn not null/undefined iff the user is logged in.
 * @returns {string} representing the error, if it exists; otherwise, returns an
 * empty string.
 */
function handleTransactErrors(quantity, balance, price, itemID, username, loggedIn) {
  if (!loggedIn) {
    return 'You are not logged in';
  } else if (!quantity[0]) {
    return 'Item #' + itemID + ' does not exist.';
  } else if (quantity[0].quantity < quantity[1]) {
    return 'You requested to buy ' + quantity[1] + ' items but only ' + quantity[0].quantity +
           ' is available.';
  } else if (!balance) {
    return username + ' is not a valid user.';
  } else if (balance.balance < price.price * quantity[1]) {
    return 'You only have Ɖ' + balance.balance + ' but ' + quantity[1] + ' item(s) with ID ' +
      itemID + ' cost(s) Ɖ' + price.price * quantity[1] + '.';
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
 * @returns {object} the JSON object containing the user's balance after the
 * transaction and the transaction ID.
 */
async function transact(db, username, itemID, price, balance, quantity) {
  let transactionID = await db.run(CREATE_TXN, [username, itemID, quantity * price, quantity]);
  await db.run(UPDATE_BALANCE, [balance - quantity * price, username]);
  let userBalance = await db.get(GET_BALANCE, [username]);
  await db.close();
  return {'confirmation_number': transactionID.lastID, 'balance': userBalance.balance};
}

/**
 * Get all of the items from the Items table, along with their average score.
 * @returns {object} the JSON array representing all of the items that we get from
 *                   the Items table.
 */
async function getItemsFromTable() {
  let db = await getDBConnection();
  let dbResult = await db.all(GET_ITEMS);
  for (let i = 0; i < dbResult.length; i++) {
    dbResult[i]['avg_score'] = await getAverageScore(dbResult[i].item_id);
  }
  await db.close();
  return dbResult;
}

/**
 * Get the item IDs of the items matching a search query.
 * @param {string} searchQuery the search query.
 * @returns {object} the JSON object representing the IDs of the items matching
 * the search query.
 */
async function getItemsBySearchQuery(searchQuery) {
  let db = await getDBConnection();
  let likeClause = '%' + searchQuery + '%';
  let dbResult = await db.all(GET_ITEMS_BY_SEARCH_QUERY, [likeClause, likeClause, likeClause]);
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
  let oneItemInfo = await db.get(GET_ONE_ITEM, [itemID]);
  if (oneItemInfo) {
    oneItemInfo['avg_score'] = await getAverageScore(itemID);
    oneItemInfo['feedbacks'] = await db.all(GET_ITEM_FEEDBACK_QUERY, [itemID]);
  }
  await db.close();
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
  await db.close();
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
