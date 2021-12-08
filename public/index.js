/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC and TODO: Add Jim's section.
 * TODO: Add comments.
 */
'use strict';
(function() {

  const ITEMS = '/items';

  const ITEM = '/item/';

  const SEARCH = '/search/';

  const CREATE_ACCOUNT = '/createaccount';

  const LOGIN_ACCOUNT = '/login';

  const STAR_WIDTH = 75;

  const MAX_RATING = 5.0;

  const NUM_PRICE_RANGES = 4;

  const NUM_CATEGORIES = 5;

  // Retrieved from http://clipart-library.com/clipart/riLo47oqT.htm
  const STARS = 'img/stars.png';

  const TWO_SECS = 5000;

  window.addEventListener('load', init);

  /**
   *
   */
  function init() {
    requestItems();
    id('accounts-btn').addEventListener('click', accountView);
    id('home-btn').addEventListener('click', homeView);
    qs('div#filters > form > button').addEventListener('click', (event) => {
      event.preventDefault();
      updateDisplayedItems();
    });
    id('list').addEventListener('click', listView);
    id('grid').addEventListener('click', gridView);
    id('search-btn').addEventListener('click', search);
    id('sign-up-btn').addEventListener('click', signUp);
    id('login-btn').addEventListener('click', loginView);
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
   * 
   */
  function createAccount() {
    let data = new FormData();
    data.append('username', id('username').value);
    data.append('password', id('password').value);
    data.append('email', id('email').value);
    fetch(CREATE_ACCOUNT, {method: 'POST', body: data})
      .then(statusCheck)
      .then(() => displayLoggedIn(id('username').value))
      .catch((error) => handleError(error.message));
  }

  /**
   * 
   */
  function login() {
    let data = new FormData();
    data.append('user', id('lg-username').value);
    data.append('password', id('lg-password').value);
    fetch(LOGIN_ACCOUNT, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(processLoginResponse)
      .catch((error) => handleError(error.message));
  }

  /**
   * 
   * @param {*} loginResponse 
   */
  function processLoginResponse(loginResponse) {
    if (loginResponse) {
      displayLoggedIn(id('lg-username').value);
    } else {
      throw new Error("Please login again. You have a wrong username or wrong password.");
    }
  }

  /**
   * 
   */
  function displayLoggedIn(username) {
    id('dropdown').classList.add('hidden');
    id('user').textContent = 'Logged in as ' + username;
    id('user').classList.remove('hidden');
    id('sign-up').classList.add('hidden');
    id('login').classList.add('hidden');
    id('home').classList.remove('hidden');
    id('sign-up-btn').classList.add('hidden');
    id('login-btn').classList.add('hidden');
    id('dropdown-cntr').classList.add('norm');
    id('accounts-btn').classList.add('norm');
  }

  /**
   * 
   */
  function signUp() {
    id('sign-up').classList.remove('hidden');
    id('home').classList.add('hidden');
    id('transactions').classList.add('hidden');
  }

  /**
   * 
   */
  function loginView() {
    id('login').classList.remove('hidden');
    id('sign-up').classList.add('hidden');
    id('home').classList.add('hidden');
    id('transactions').classList.add('hidden');
  }

  /**
   * 
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
   * 
   * @param {*} json 
   */
  function displaySearchResults(json) {
    console.log(json);
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
   * 
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
   * 
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
   * 
   */
  function updateDisplayedItems() {
    let notSelectedPrices = [];
    let prices = qsa('article#price input:not(:checked)');
    if (prices.length < NUM_PRICE_RANGES) {
      for (let i = 0; i < prices.length; i++) {
        let range = prices[i].value.split('–');
        notSelectedPrices.push([parseInt(range[0]), parseInt(range[1])]);
      }
    }
    let categories = qsa('article#category input:not(:checked)');
    let notSelectedCategories = [];
    if (categories.length < NUM_CATEGORIES) {
      for (let i = 0; i < categories.length; i++) {
        notSelectedCategories.push(categories[i].value.toUpperCase().charAt(0) +
                                   categories[i].value.substring(1));
      }
    }
    let checkedRating = qs('article#rating input:checked');
    let rating = checkedRating === null ? 0 : checkedRating.value.charAt(0);
    let items = qsa('#items > article');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('hidden');
    }
    outer:
    for (let i = 0; i < items.length; i++) {
      let price = items[i].querySelector('.price').textContent.substring(1);
      for (let j = 0; j < notSelectedPrices.length; j++) {
        if (price >= notSelectedPrices[j][0] && price <= notSelectedPrices[j][1]) {
          items[i].classList.add('hidden');
          continue outer;
        }
      }
      let checkedTitle = items[i].querySelector('.star-container');
      let title = checkedTitle === null ? 0 : checkedTitle.title;
      if (notSelectedCategories.includes(items[i].querySelector('.category').textContent)
          || title < rating) {
        items[i].classList.add('hidden');
      }
    }
  }

  /**
   * Request all the items for sale.
   */
  function requestItems() {
    fetch(ITEMS)
      .then(statusCheck)
      .then(res => res.json())
      .then(displayItems)
      .catch(() => {
        handleError('Oops. There was an error retrieving the items for sale.');
      });
  }

  /**
   * 
   * @param {*} json 
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
    let itemName = gen('p');
    itemName.textContent = json.item_name;
    viewDescContainer.appendChild(itemName);
    let price = gen('p');
    price.classList.add('price');
    price.textContent = 'Ɖ' + json.price;
    viewDescContainer.appendChild(price);
    let category = gen('p');
    category.classList.add('category');
    category.textContent = json.category;
    viewDescContainer.appendChild(category);
    viewDescContainer.appendChild(createStarRating(json.avg_score));
    let quantity = gen('p');
    quantity.textContent = json.quantity > 10 ? 'More than 10 available' : json.quantity +
                           ' available';
    viewDescContainer.appendChild(quantity);
    item.appendChild(viewDescContainer);
    return item
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
    itemPicture.src = 'img/' + json.item_id + '.png';
    itemPicture.alt = json.item_name;
    return itemPicture;
  }

  /**
   *
   */
  function requestSpecificItemDetails() {
    fetch(ITEM + this.src.substring(this.src.indexOf('img') + 4, this.src.lastIndexOf('.')))
      .then(statusCheck)
      .then(res => res.json())
      .then(displaySpecificItemDetails)
      .catch(() => {
        handleError('Oops. There was an error retrieving the specific details of an item.');
      });
  }

  function displaySpecificItemDetails(json) {
    id('items').classList.add('hidden');
    let item = gen('article');
    let itemTitle = gen('h2');
    itemTitle.textContent = json.item_name;
    item.appendChild(itemTitle);
    let itemContainer = gen('div');
    itemContainer.id = 'itemContainer';
    let itemPicture = createImage(json);
    itemContainer.appendChild(itemPicture);
    let descContainer = gen('div');
    let price = gen('p');
    price.classList.add('price');
    price.textContent = 'Price: Ɖ' + json.price;
    descContainer.appendChild(price);
    descContainer.appendChild(createStarRating(json.avg_score));
    let form = gen('form');
    let textInput = gen('input');
    textInput.type = 'text';
    textInput.min = '1';
    textInput.max = json.quantity;
    textInput.id = 'quantity';
    form.appendChild(textInput);
    let label = gen('label');
    label.for = textInput.id;
    label.textContent = json.quantity > 10 ? ' More than 10 available' : json.quantity +
    ' available';
    form.appendChild(label);
    descContainer.appendChild(form);
    let category = gen('p');
    category.textContent = 'Category: ' + json.category;
    category.classList.add('category');
    descContainer.appendChild(category);
    let buyBtn = gen('button');
    buyBtn.classList.add('green');
    buyBtn.textContent = 'Buy';
    descContainer.appendChild(buyBtn);
    let description = gen('p');
    description.id = 'description';
    description.textContent = 'Description:';
    descContainer.appendChild(description);
    let descriptionContent = gen('p');
    descriptionContent.textContent = json.description;
    descContainer.appendChild(descriptionContent);
    itemContainer.appendChild(descContainer);
    item.appendChild(itemContainer);
    let feedbacks = gen('section');
    feedbacks.id = 'feedbacks';
    let reviews = gen('h2');
    reviews.textContent = 'Reviews:';
    feedbacks.append(reviews);
    for (let i = 0; i < json.feedbacks.length; i++) {
      let feedback = gen('article');
      feedback.appendChild(createStarRating(json.feedbacks[i].score));
      if (json.feedbacks[i].feedback_text !== undefined) {
        let feedbackContent = gen('p');
        feedbackContent.textContent = json.feedbacks[i].feedback_text;
        feedback.appendChild(feedbackContent);
      }
      feedbacks.appendChild(feedback);
    }
    item.appendChild(feedbacks);
    id('item').appendChild(item);
    id('item').classList.remove('hidden');
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
    id('transactions').classList.remove('hidden');
  }

  /**
   * Switches the view to the Home View.
   */
  function homeView() {
    id('home').classList.remove('hidden');
    id('transactions').classList.add('hidden');
    id('items').classList.remove('hidden');
    id('item').innerHTML = '';
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