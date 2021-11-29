/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC and TODO: Add Jim's section.
 * TODO: Add comments.
 */

'use strict';

const express = require('express');

const multer = require('multer');

const sqlite3 = require('sqlite3');

const sqlite = require('sqlite');

const app = express();

const SPECIFIED_PORT = 8000;

// For application/x-www-form-urlencoded.
app.use(express.urlencoded({extended: true})); // Built-in middleware.

// For application/json.
app.use(express.json()); // Built-in middleware.

// For multipart/form-data (required with FormData).
app.use(multer().none()); // Requires the "multer" module.



/**
 * Establishes a database connection to the database and returns the database
 * object. Any errors that occur should be caught in the function that calls this
 * one
 * @returns {object} the database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'yipper.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || SPECIFIED_PORT;
app.listen(PORT);