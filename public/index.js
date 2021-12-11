/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC
 * TODO: Add comments.
 */
'use strict';
(function() {

  const ITEMS = '/items';

  const ITEM = '/item/';

  const SEARCH = '/search/';

  const IMG_PATH = 'img/';

  const SUBMIT_FEEDBACK = '/feedback';

  const LOGGED_IN_AS = 'Logged in as ';

  const CREATE_ACCOUNT = '/createaccount';

  const LOGIN_ACCOUNT = '/login';

  const BUY_ITEM = '/buy/';

  const GET_TRANSACTION = '/transactions/';

  const STAR_WIDTH = 75;

  const MAX_RATING = 5.0;

  const NUM_PRICE_RANGES = 4;

  const NUM_CATEGORIES = 5;

  const QUANTITY_THRESHOLD = 10;

  // Retrieved from http://clipart-library.com/clipart/riLo47oqT.htm
  const STARS = IMG_PATH + 'stars.png';

  const TWO_SECS = 5000;

  window.addEventListener('load', init);

  /**
   * Initialize the client-side program by setting up local storage,
   * requesting all items to fill in the page, and adding associated
   * event listeners.
   */
  function init() {
    manageLocalStorage();
    requestItems();
    addAccountsEventListeners();
    addItemsAndFeedbacksListeners();
    addTransactionEventListeners();
  }

  /**
   * Manage the local storage of the website by getting some data
   * from local storage if there is a data associated with this website.
   */
  function manageLocalStorage() {
    if (window.localStorage.getItem('user')) {
      displayLoggedIn(window.localStorage.getItem('user'));
      setUserDogeCoinBalance(window.localStorage.getItem('balance'));
      document.cookie = 'user=' + window.localStorage.getItem('user');
    }
  }

  /**
   * Add event listeners for buttons and interfaces related to the accounts.
   */
  function addAccountsEventListeners() {
    id('accounts-btn').addEventListener('click', accountView);
    id('login-btn').addEventListener('click', loginView);
    id('logout-btn').addEventListener('click', logoutView);
    qs('#sign-up form').addEventListener('submit', (event) => {
      event.preventDefault();
      createAccount();
    });
    qs('#login form').addEventListener('submit', (event) => {
      event.preventDefault();
      login();
    });
  }

  /**
   * Display the user as being logged out from the program and clearing any
   * persisting local storage.
   */
  function logoutView() {
    window.localStorage.clear();
    document.cookie = 'user=; Max-Age=-9;';
    id('user').textContent = '';
    qs('#transactions > p').textContent = 'Ɖ 0';
    id('home').classList.remove('hidden');
    id('transactions').classList.add('hidden');
    id('not-logged-in').classList.add('dropdown');
    id('logged-in').classList.remove('dropdown');
    id('logged-in').classList.add('hidden');
    id('user').classList.add('hidden');
    id('sign-up-btn').classList.remove('hidden');
    id('login-btn').classList.remove('hidden');
    qs('#transactions > article').classList.add('hidden');
  }

  /**
   * Add the event listeners to buttons and interface related with
   * the items and the feedbacks.
   */
  function addItemsAndFeedbacksListeners() {
    id('home-btn').addEventListener('click', homeView);
    qs('div#filters > form > button').addEventListener('click', (event) => {
      event.preventDefault();
      updateDisplayedItems();
    });
    id('list').addEventListener('click', listView);
    id('grid').addEventListener('click', gridView);
    id('search-btn').addEventListener('click', search);
    id('sign-up-btn').addEventListener('click', signUp);

    id('feedback-btn').addEventListener('click', makeFeedbackFormVisible);
    qs('#item > article > form').addEventListener('submit', (event) => {
      event.preventDefault();
      submitFeedback();
    });
  }

  /**
   * Add the event listeners for transactions related buttons and interfaces.
   */
  function addTransactionEventListeners() {
    qs('#item-container form').addEventListener('submit', (event) => {
      event.preventDefault();
      confirmTransaction();
    });
    id('yes').addEventListener('click', buy);
    id('no').addEventListener('click', closeTransactionWindow);
    id('close').addEventListener('click', closeTransactionWindow);
  }

  /**
   * Close the transaction window when the user is done with the transaction.
   */
  function closeTransactionWindow() {
    id('transaction-confirmation').classList.add('hidden');
    id('incomplete-transaction').classList.remove('hidden');
    id('complete-transaction').classList.add('hidden');
  }

  /**
   * Perform the buying action by sending request to the server, and if successful,
   * update the balance of the user.
   */
  function buy() {
    let imgSrc = qs('#item-container > img').src;
    let itemID = imgSrc.substring(
      imgSrc.indexOf(IMG_PATH) + IMG_PATH.length,
      imgSrc.lastIndexOf('.')
    );

    let user = id('user').textContent.substring(LOGGED_IN_AS.length);
    fetch(
      BUY_ITEM + itemID + '/' + (user ? user : 'none') + '/' + id('quantity').value,
      {method: 'POST'}
    )
      .then(statusCheck)
      .then(res => res.json())
      .then((json) => {
        updateBalance(json, itemID);
      })
      .catch(handleError);
  }

  /**
   * Display the transaction, update the items page to contain the updated stocks, and
   * update the amount of DogeCoin the user currently has.
   * @param {JSONObject} json - the JSON object representing the data returned
   *                            from the server when we send the request to
   *                            buy an item for a user
   * @param {Number} itemID - the item ID of the item that the user buy. 
   */
  function updateBalance(json, itemID) {
    qs('#complete-transaction > p').textContent = 'Confirmation code: ' +
      json.confirmation_number;
    id('incomplete-transaction').classList.add('hidden');
    id('complete-transaction').classList.remove('hidden');
    requestItems();
    requestSpecificItemDetails(parseInt(itemID));
    setUserDogeCoinBalance(json.balance);
  }

  /**
   * Add in a confirmation box that the user can click to either confirm or
   * cancel the sale.
   */
  function confirmTransaction() {
    id('transaction-confirmation').classList.remove('hidden');
    id('transaction-confirmation').classList.add('flex-col');
  }

  /**
   * Handles the event where the user creates the account and send request to the server
   * so the server would have information about the user's account as well. If successful,
   * automatically log the user into the website.
   */
  function createAccount() {
    let data = new FormData();
    data.append('username', id('username').value);
    data.append('password', id('password').value);
    data.append('email', id('email').value);
    fetch(CREATE_ACCOUNT, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(setUserDogeCoinBalance)
      .then(() => displayLoggedIn(id('username').value))
      .then(() => {
        window.localStorage.setItem('user', id('username').value);
        document.cookie = 'user=' + window.localStorage.getItem('user');
      })
      .catch((error) => handleError(error.message));
  }

  /**
   * Set the Doge Coin balance of the user.
   * @param {Number} balance - the amount of Doge Coin user currently has
   */
  function setUserDogeCoinBalance(balance) {
    qs('#transactions p').textContent = 'Ɖ ' + String(balance);
  }

  /**
   * Handles the event where the user log into the program if they enter the
   * right user name and password.
   */
  function login() {
    let data = new FormData();
    let username = id('lg-username').value;
    data.append('user', username);
    data.append('password', id('lg-password').value);
    fetch(LOGIN_ACCOUNT, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(processLoginResponse)
      .catch((error) => handleError(error.message));
  }

  /**
   * Process the login response (the login balance) retrieved from the server and log
   * the user into the program if the response is valid.
   * @param {Number} loginBalance - the balance the user currently have. If the balance
   *                                is negative, it means the user enters the wrong
   *                                information.
   */
  function processLoginResponse(loginBalance) {
    if (loginBalance >= 0) {
      window.localStorage.setItem('user', id('lg-username').value);
      window.localStorage.setItem('balance', loginBalance);
      document.cookie = 'user=' + window.localStorage.getItem('user');
      displayLoggedIn(id('lg-username').value);
      setUserDogeCoinBalance(loginBalance);
    } else {
      throw new Error("Please login again. You have a wrong username or wrong password.");
    }
  }

  /**
   * Display the page when the user can successfully log into the program so that the user
   * have access to the accounts page.
   * @param {String} username - the username of the user who just logged into the program 
   */
  function displayLoggedIn(username) {
    id('not-logged-in').classList.add('hidden');
    id('user').textContent = LOGGED_IN_AS + username;
    id('user').classList.remove('hidden');
    id('sign-up').classList.add('hidden');
    id('login').classList.add('hidden');
    id('home').classList.remove('hidden');
    id('not-logged-in').classList.remove('dropdown');
    id('logged-in').classList.add('dropdown');
    id('sign-up-btn').classList.add('hidden');
    id('login-btn').classList.add('hidden');
  }

  /**
   * Handles the event when the sign up button is clicked and show the sign up page.
   */
  function signUp() {
    id('sign-up').classList.remove('hidden');
    id('login').classList.add('hidden');
    id('home').classList.add('hidden');
    id('transactions').classList.add('hidden');
  }

  /**
   * Handles the event when the login button is clicked and show the login page.
   */
  function loginView() {
    id('login').classList.remove('hidden');
    id('sign-up').classList.add('hidden');
    id('home').classList.add('hidden');
    id('transactions').classList.add('hidden');
  }

  /**
   * Handles the event where the search button is clicked and send the request to the server
   * so that the server searches for items based on the search query and display only the
   * search results back to the user.
   */
  function search() {
    if (id('search-term').value.trim() !== '') {
      fetch(SEARCH + id('search-term').value)
        .then(statusCheck)
        .then(res => res.json())
        .then(displaySearchResults)
        .catch(() => {
          handleError('Ooops. There was an error searching for ' +
                      id('search-term').value + '.');
        })
    }
  }

  /**
   * Display the search results based on the data obtained from the server.
   * @param {JSONObject} json - a JSON Object representing the ids of items that
   *                            match the search query.
   */
  function displaySearchResults(json) {
    let items = qsa('#items > article');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('hidden');
    }
    for (let i = 0; i < items.length; i++) {
      if (!json.includes(parseInt(items[i].id))) {
        items[i].classList.add('hidden');
      }
    }
  }

  /**
   * Show the items sold on Craigsbay in form of a list where each row only
   * contains 1 item.
   */
  function listView() {
    id('grid').classList.remove('selected');
    id('list').classList.add('selected');
    id('items').classList.remove('flex');
    id('items').classList.add('list');
    let items = qsa('#items > article');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('list');
      items[i].classList.add('flex');
    }
  }

  /**
   * Show the items sold on Craigsbay in form of a grid, where multiple items can be
   * on one row, depending on the page width.
   */
  function gridView() {
    id('items').classList.add('flex');
    id('items').classList.remove('list');
    id('grid').classList.add('selected');
    id('list').classList.remove('selected');
    let items = qsa('#items > article');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.add('list');
      items[i].classList.remove('flex');
    }
  }

  /**
   * Update the items displayed on the home page when the user hits the submit button
   * such that the user only sees the items that match the filter.
   */
  function updateDisplayedItems() {
    let notSelectedPrices = getNotSelectedPrices();
    let notSelectedCategories = getNotSelectedCategories();

    let checkedRating = qs('article#rating input:checked');
    let rating = checkedRating === null ? 0 : checkedRating.value.charAt(0);
    let items = qsa('#items > article');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('hidden');
    }

    for (let i = 0; i < items.length; i++) {
      let price = items[i].querySelector('.price').textContent.substring(1);
      for (let j = 0; j < notSelectedPrices.length; j++) {
        if (price >= notSelectedPrices[j][0] && price <= notSelectedPrices[j][1]) {
          items[i].classList.add('hidden');
        }
      }
      let checkedTitle = items[i].querySelector('.star-container');
      let title = checkedTitle === null ? 0 : checkedTitle.title;
      if (notSelectedCategories.includes(items[i].querySelector('.category').textContent) ||
          title < rating) {
        items[i].classList.add('hidden');
      }
    }
  }

  /**
   * Get the array of the price ranges that are not selected.
   * @returns {PriceRange[]} an array of array of numbers representing the array of price
   *                         ranges that is not selected by the user.
   */
  function getNotSelectedPrices() {
    let notSelectedPrices = [];
    let prices = qsa('article#price input:not(:checked)');
    if (prices.length < NUM_PRICE_RANGES) {
      for (let i = 0; i < prices.length; i++) {
        let range = prices[i].value.split('–');
        notSelectedPrices.push([parseInt(range[0]), parseInt(range[1])]);
      }
    }

    return notSelectedPrices;
  }

  /**
   * Get the array of categories that is not selected by the user.
   * @returns {String[]} an array of String representing an array of categories that
   *                     is not selected by the user
   */
  function getNotSelectedCategories() {
    let categories = qsa('article#category input:not(:checked)');
    let notSelectedCategories = [];
    if (categories.length < NUM_CATEGORIES) {
      for (let i = 0; i < categories.length; i++) {
        notSelectedCategories.push(categories[i].value.toUpperCase().charAt(0) +
                                   categories[i].value.substring(1));
      }
    }

    return notSelectedCategories;
  }

  /**
   * Request all the items for sale.
   */
  function requestItems() {
    id('items').innerHTML = '';
    fetch(ITEMS)
      .then(statusCheck)
      .then(res => res.json())
      .then(displayItems)
      .catch(() => {
        handleError('Oops. There was an error retrieving the items for sale.');
      });
  }

  /**
   * Display each item in the "json" data onto the home page.
   * @param {JSONObject} json - the JSON object representing the array of items on
   *                            Craigsbay website.
   */
  function displayItems(json) {
    for (let i = 0; i < json.length; i++) {
      id('items').appendChild(constructItem(json[i]));
    }
  }

  /**
   *
   * @param {*} json
   * @returns
   */
  function constructItem(json) {
    let item = gen('article');
    item.classList.add('list');
    item.id = json.item_id;
    let itemPicture = createImage(json);
    itemPicture.addEventListener('click', requestSpecificItemDetails);
    item.appendChild(itemPicture);
    let viewDescContainer = gen('div');
    viewDescContainer.id = 'viewDescContainer';

    appendParagraph(viewDescContainer, json.item_name);
    let price = appendParagraph(viewDescContainer, 'Ɖ' + json.price);
    price.classList.add('price');
    let category = appendParagraph(viewDescContainer, json.category);
    category.classList.add('category');

    viewDescContainer.appendChild(createStarRating(json.avg_score));

    if (json.quantity > QUANTITY_THRESHOLD) {
      appendParagraph(viewDescContainer, 'More than ' + QUANTITY_THRESHOLD + ' available');
    } else {
      appendParagraph(viewDescContainer, String(json.quantity) + ' available');
    }

    item.appendChild(viewDescContainer);
    return item;
  }

  /**
   *
   * @param {*} score
   * @returns
   */
  function createStarRating(score) {
    let starDiv = gen('div');
    starDiv.classList.add('star-container');
    let stars = gen('img');
    stars.classList.add('star');
    stars.src = STARS;
    stars.alt = 'stars';
    starDiv.appendChild(stars);
    starDiv.title = score;
    starDiv.style.width = STAR_WIDTH * score / MAX_RATING + 'px';
    return starDiv;
  }

  /**
   *
   * @param {*} json
   * @returns
   */
  function createImage(json) {
    let itemPicture = gen('img');
    itemPicture.src = IMG_PATH + json.item_id + '.png';
    itemPicture.alt = json.item_name;
    return itemPicture;
  }

  /**
   *
   */
  function requestSpecificItemDetails(itemID) {
    let item;
    if (Number.isInteger(itemID)) {
      item = itemID;
    } else {
      item = this.src.substring(this.src.indexOf('img') + 4, this.src.lastIndexOf('.'));
    }
    fetch(ITEM + item)
      .then(statusCheck)
      .then(res => res.json())
      .then(displaySpecificItemDetails)
      .catch((err) => handleError(err));
  }

  /**
   *
   * @param {*} json
   */
  function displaySpecificItemDetails(json) {
    id('items').classList.add('hidden');
    qs('#item > article > h2').textContent = json.item_name;
    qs('#item-container > img').src = IMG_PATH + json.item_id + '.png';
    qs('#item-container > img').alt = json.item_name;
    qs('#item-container .price').textContent = 'Price: Ɖ' + json.price;
    qs('#item-container .category').textContent = 'Category: ' + json.category;
    qs('#item-container input').max = json.quantity;
    let prevStar = qs('#item-container .star-container');
    prevStar.parentElement.replaceChild(createStarRating(json.avg_score), prevStar);
    if (json.quantity > QUANTITY_THRESHOLD) {
      qs('#item-container form label').textContent = ' More than ' +
        QUANTITY_THRESHOLD + ' available';
    } else {
      qs('#item-container form label').textContent = json.quantity + ' available';
    }

    id('description').nextElementSibling.textContent = json.description;
    addAllFeedback(json);
    makeFeedbackButtonVisible();
    id('item').classList.remove('hidden');
  }

  /**
   * Add all feedbacks from json to an item page
   * @param {*} json
   */
  function addAllFeedback(json) {
    id('feedbacks').innerHTML = '';
    for (let i = 0; i < json.feedbacks.length; i++) {
      let feedback = gen('article');
      feedback.appendChild(createStarRating(json.feedbacks[i].score));
      appendParagraph(feedback, json.feedbacks[i].user_name);

      if (json.feedbacks[i].feedback_text !== undefined) {
        appendParagraph(feedback, json.feedbacks[i].feedback_text);
      }
      id('feedbacks').appendChild(feedback);
    }
  }

  function makeFeedbackButtonVisible() {
    id('feedback-btn').classList.remove('hidden');
    qs('#item > article > form').classList.add('hidden');
  }

  function makeFeedbackFormVisible() {
    id('feedback-btn').classList.add('hidden');
    qs('#item > article > form').classList.remove('hidden');
  }

  function submitFeedback() {
    let data = new FormData();
    let username = id('user').textContent.substring(LOGGED_IN_AS.length);
    data.append('username', (username ? username : 'none'));
    let imgSrc = qs('#item-container > img').src;
    let itemID = imgSrc.substring(imgSrc.indexOf(IMG_PATH) + 4, imgSrc.lastIndexOf('.'));
    let score = qs('#feedback-form input').value;
    data.append('score', score);
    data.append('id', itemID);
    data.append('description', qs('textarea').value);
    fetch(SUBMIT_FEEDBACK, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.text())
      .then(() => requestSpecificItemDetails(parseInt(itemID)))
      .then(makeFeedbackButtonVisible)
      .catch(handleError);
  }

  /**
   *
   * @param {*} errorMessage
   */
  function handleError(errorMessage) {
    id('error').textContent = errorMessage;
    id('error').classList.remove('hidden');
    setTimeout(function() {
      id('error').classList.add('hidden');
    }, TWO_SECS);
  }

  /**
   * Switches the view to the Transactions View.
   */
  function accountView() {
    id('home').classList.add('hidden');
    id('sign-up').classList.add('hidden');
    id('login').classList.add('hidden');
    id('transactions').classList.remove('hidden');
    let username = id('user').textContent.substring(LOGGED_IN_AS.length);
    fetch(GET_TRANSACTION + (username ? username : 'none'))
      .then(statusCheck)
      .then(res => res.json())
      .then(displayTransactions)
      .catch(handleError);
  }

  function displayTransactions(transactions) {
    qs('#transactions article').innerHTML = "";

    for (let i = 0; i < transactions.length; i++) {
      let currTransaction = createIndividualTransaction(transactions[i]);
      qs('#transactions article').appendChild(currTransaction);
    }
  }

  function createIndividualTransaction(transactionObj) {
    let transactionContainer = gen('article');

    let transactionIdPart = "Transaction id: " + transactionObj.transaction_id;
    appendParagraph(transactionContainer, transactionIdPart);
    let dateString = (new Date(transactionObj.transaction_date)).toLocaleString();
    appendParagraph(transactionContainer, "Date: " + dateString);

    appendParagraph(transactionContainer, "Item name: " + transactionObj.item_name);
    appendParagraph(transactionContainer, "Total cost: Ɖ" + transactionObj.total_price);
    return transactionContainer;
  }

  function appendParagraph(element, pContent) {
    let paragraph = gen('p');
    paragraph.textContent = pContent;
    element.append(paragraph);
    return paragraph;
  }

  /**
   * Switches the view to the Home View.
   */
  function homeView() {
    id('home').classList.remove('hidden');
    id('transactions').classList.add('hidden');
    id('items').classList.remove('hidden');
    id('item').classList.add('hidden');
    id('sign-up').classList.add('hidden');
    id('login').classList.add('hidden');
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Shortcut Helper functions (with comments) from:
   * https://replit.com/@afitzg/cse154-21au-template#script.js
   */

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {String} idName - element ID
   * @returns {Object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {String} selector - CSS query selector.
   * @returns {Object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {String} selector - CSS query selector
   * @returns {Object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {String} tagName - HTML tag name for new DOM element.
   * @returns {Object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();
