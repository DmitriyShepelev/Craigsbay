# Craigsbay API Documentation
With a GET request, the Craigsbay API allows users to retrieve all items,
details about a specific item, items matching a search query, and a transaction
history. With a POST request, users can submit feedback, buy an item, create an
account, and verify login information.

## Get every item
**Request Format:** `/items`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns every item available for sale.

**Example Request:** `/items`

**Example Output:** (abbreviated)
```json
[
  {
    "item_id": 1,
    "quantity": 1,
    "price": 35,
    "category": "Food",
    "item_name": "Goldfish Crackers",
    "avg_score": 2.909090909090909
  },
  {
    "item_id": 2,
    "quantity": null,
    "price": 1200,
    "category": "Electronics",
    "item_name": "Cherry Computer Monitor",
    "avg_score": 2.857142857142857
  },
  .
  .
  .
  {
    "item_id": 12,
    "quantity": 4,
    "price": 444.44,
    "category": "Collectibles",
    "item_name": "Rare Penny",
    "avg_score": 5
  }
]
```
**Error Handling:**
* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Get items matching a search query
**Request Format:** `/search/:query`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets all of the item IDs matching the search query `:query`.

**Example Request:** `/search/a`

**Example Response:**
```json
[
  1,
  3,
  6,
  7,
  9,
  10,
  12
]
```

**Error Handling:**
* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Get detailed information about an item
**Request Format:** `/item/:itemID`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets detailed information about an item with ID `:itemID`.

**Example Request:** `/item/1`

**Example Response:**
```json
{
  "item_id": 4,
  "quantity": 13,
  "price": 125,
  "item_name": "UW T-shirt",
  "category": "Clothing",
  "description": "Show your W heart by buying this T-shirt.",
  "avg_score": 2,
  "feedbacks": [
    {
      "user_name": "jim2",
      "score": 2,
      "feedback_text": null
    }
  ]
}
```

**Error Handling:**
* `400` error: If an item with ID `:itemID` does not exist, return an error with
the plain text message `Item #:itemID does not exist.`.

* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Get a user's transactions
**Request Format:** `/transactions/:username`

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets the transaction history of `:username` sorted descending
by `transaction_date`.

**Example Request:** `/transactions/David`

**Example Response:** (abbreviated)
```json
[
  {
    "item_name": "Superman Action Figure",
    "transaction_id": 30,
    "item_id": 3,
    "total_price": 250,
    "transaction_date": "2021-12-08 00:59:26"
  },
  {
    "item_name": "Superman Action Figure",
    "transaction_id": 29,
    "item_id": 3,
    "total_price": 250,
    "transaction_date": "2021-12-08 00:55:08"
  },

  .
  .
  .

  {
    "item_name": "UW T-shirt",
    "transaction_id": 21,
    "item_id": 4,
    "total_price": 125,
    "transaction_date": "2021-12-07 20:36:41"
  }
]
```

**Error Handling:**
* `400` error: If the user is not logged in, return an error with the plain text
message `You are not logged in.`.
* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Verify login information
**Request Format:** `/login` with POST parameters `user` and `password`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Verifies a user's username and password information, returning
the user's balance if the verification was successful. Otherwise, returns -1.

**Example Request:** `/login` with `user=jim` and `password=password`.

**Example Response:**
```json
95.05
```

**Error Handling:**
* `400` error: If at least one POST parameter is missing, return an error with
the plain text message `At least one POST parameter is missing.`.

* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Create an account
**Request Format:** `/createaccount` with POST parameters `username`,
`password`, and `email`

**Request Type:** POST

**Returned Data Format**: Plain text

**Description:** Creates an account with the `username`, `password`, and
`email` information, and responds with the default starting balance
of the user if the creation was successful.

**Example Request:** `/createaccount` with `username=Richard`,
`password=asdfsd`, and `email=richard@gmail.com`.

**Example Response:**
2500

**Error Handling:**
* `400` error:
  * If at least one POST parameter is missing, return an error with
the plain text message `At least one POST parameter is missing.`.
  * If `username` already exists, return an error with the plain text message
`<username> already exists.`.

* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Buy an item
**Request Format:** `/buy` with POST parameters `user`, `id`, and `quantity`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Allows user with username `user` to buy `quantity` item(s) with item
id of `id`. Returns `confirmation_code` representing the transaction's
confirmation code/id and `balance` representing the user's balance after the
purchase.

**Example Request:** `/buy` with POST parameters `user=David`, `id=4`, `quantity=2`

**Example Response:**

```json
{
  "confirmation_code": 29,
  "balance": 465
}
```

**Error Handling:**
* `400` error:
  * If at least one of the POST parameters is missing, return an error with plain 
  text message `At least one POST parameter is missing.`
  * If the user is not logged in, return an error with the plain text message
  `You are not logged in.`.
  * If an item with ID `:itemID` does not exist, return an error with the plain
  text message `Item #:itemID does not exist.`
  * If there is only `quantity` items with ID `:itemID` available for purchase
  but the user wants to buy `:quantity` items with ID `:itemID` such that
  `quantity < :quantity`, return an error with the plain text message
  `You requested to buy :quantity items but only <quantity> is available.`.
  * If `:username` is not a valid user, return an error with the plain text
  message `:username is not a valid user.`.
  * If the user wants to buy `:quantity` items with ID `:itemID` but his balance
  `balance` is less than the cost `cost` of `:quantity` items with ID `:itemID`,
  return an error with the plain text message
  `You only have Ɖ<balance> but :quantity item(s) with ID :itemID cost(s)`
  ` Ɖ<cost>.`.

* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.

## Submit feedback
**Request Format:** `/feedback` with POST parameters `username`,
`score`, `description`, and `id`

**Request Type:** POST

**Returned Data Format**: Plain text

**Description:** Submits feedback for an item with ID `id` from a user
`username` with a score of `score` and description of `description`. Returns
`Success!` indicating the submission's success.

**Example Request:** `/feedback` with `username=Richard`, `score=5`,
`description=Great` and `id=1`.

**Example Response:**
`Success!`

**Error Handling:**
* `400` error:
  * If the user is not logged in, return an error with the plain text message
  `You are not logged in.`.
  * If the `username` does not exist, return an error with the plain text message
  `<username> is not a valid username.`
  * If the item with ID `id` does not exist, return an
error with the plain text message `'There is no valid item with ID <id>.`

* `500` error: If there is a server-side error, return an error with the plain
text message `An error occurred on the server. Try again later.`.