/*
 * Name: Dmitriy Shepelev and Jim Supawish
 * Date: November 29, 2021
 * Section: CSE 154 AC and TODO: Add Jim's section.
 * TODO: Add comments.
 */
'use strict';
(function() {

  const ITEMS = '/items';

  const ITEM = 'item/';

  const STAR_WIDTH = 75;

  const MAX_RATING = 5.0;

  // Retrieved from http://clipart-library.com/clipart/riLo47oqT.htm
  const STARS = 'img/stars.png';

  const TWO_SECS = 5000;

  window.addEventListener('load', init);

  /**
   *
   */
  function init() {
    requestItems();
    document.getElementById('accounts-btn').addEventListener('click', accountView);
    document.getElementById('home-btn').addEventListener('click', homeView);
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

  function displayItems(json) {
    for (let i = 0; i < json.length; i++) {
      let item = document.createElement('article');
      item.id = 'item' + json[i].item_id;
      let itemPicture = document.createElement('img');
      itemPicture.src = 'img/' + json[i].item_id + '.png';
      itemPicture.alt = json[i].item_name;
      itemPicture.addEventListener('click', requestSpecificItemDetails);
      item.appendChild(itemPicture);
      let itemName = document.createElement('p');
      itemName.textContent = json[i].item_name;
      item.appendChild(itemName);
      let price = document.createElement('p');
      price.textContent = '$' + json[i].price;
      item.appendChild(price);
      let category = document.createElement('p');
      category.textContent = json[i].category;
      item.appendChild(category);
      let starDiv = document.createElement('div');
      starDiv.classList.add('star-container');
      let stars = document.createElement('img');
      stars.classList.add('star');
      stars.src = STARS;
      stars.alt = 'stars';
      starDiv.appendChild(stars);
      starDiv.title = json[i].avg_score;
      starDiv.style.width = STAR_WIDTH * json[i].avg_score / MAX_RATING + 'px';
      item.appendChild(starDiv);
      document.getElementById('items').appendChild(item);
    }
  }

  /**
   *
   */
  function requestSpecificItemDetails() {
    fetch(ITEM)
      .then(statusCheck)
      .then(res => res.json())
      .then(displaySpecificItemDetails)
      .catch(() => {
        handleError('Oops. There was an error retrieving the specific details of an item.');
      });
  }

  function displaySpecificItemDetails(json) {

  }

  function handleError(errorMessage) {
    document.querySelector('header > p').textContent = errorMessage;
    document.querySelector('header > p').classList.remove('hidden');
    setTimeout(function() {
      document.querySelector('header > p').classList.add('hidden');
    }, TWO_SECS);
  }

  /**
   * Switches the view to the Transactions View.
   */
  function accountView() {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('transactions').classList.remove('hidden');
  }

  /**
   * Switches the view to the Home View.
   */
  function homeView() {
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('transactions').classList.add('hidden');
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
})();