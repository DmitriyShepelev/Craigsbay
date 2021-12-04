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
    document.getElementById('accounts-btn').addEventListener('click', accountView);
    document.getElementById('home-btn').addEventListener('click', homeView);
    document.querySelector('div#filters > form > button').addEventListener('click', (event) => {
      event.preventDefault();
      updateDisplayedItems();
    });
  }

  function updateDisplayedItems() {

    let notSelectedPrices = [];
    let prices = document.querySelectorAll('article#price input:not(:checked)');
    if (prices.length < NUM_PRICE_RANGES) {
      for (let i = 0; i < prices.length; i++) {
        let range = prices[i].value.split('–');
        notSelectedPrices.push([parseInt(range[0]), parseInt(range[1])]);
      }
    }
    console.log(notSelectedPrices);
    let categories = document.querySelectorAll('article#category input:not(:checked)');
    let notSelectedCategories = [];
    if (categories.length < NUM_CATEGORIES) {
      for (let i = 0; i < categories.length; i++) {
        notSelectedCategories.push(categories[i].value.toUpperCase().charAt(0) +
                                   categories[i].value.substring(1));
      }
    }
    let checkedRating = document.querySelector('article#rating input:checked');
    let rating = checkedRating === null ? 0 : checkedRating.value.charAt(0);
    let items = document.querySelectorAll('#items > article');
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
      console.log(title);
      console.log(rating);
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

  function displayItems(json) {
    for (let i = 0; i < json.length; i++) {
      document.getElementById('items').appendChild(constructItem(json[i]));
    }
  }

  function constructItem(json) {
    let item = document.createElement('article');
    item.id = 'item' + json.item_id;
    let itemPicture = createImage(json);
    itemPicture.addEventListener('click', requestSpecificItemDetails);
    item.appendChild(itemPicture);
    let itemName = document.createElement('p');
    itemName.textContent = json.item_name;
    item.appendChild(itemName);
    let price = document.createElement('p');
    price.classList.add('price');
    price.textContent = 'Ɖ' + json.price;
    item.appendChild(price);
    let category = document.createElement('p');
    category.classList.add('category');
    category.textContent = json.category;
    item.appendChild(category);
    item.appendChild(createStarRating(json));
    let quantity = document.createElement('p');
    quantity.textContent = json.quantity > 10 ? 'More than 10 available' : json.quantity +
                           ' available';
    item.appendChild(quantity);
    return item
  }

  function createStarRating(json) {
    let starDiv = document.createElement('div');
    starDiv.classList.add('star-container');
    let stars = document.createElement('img');
    stars.classList.add('star');
    stars.src = STARS;
    stars.alt = 'stars';
    starDiv.appendChild(stars);
    starDiv.title = json.avg_score;
    starDiv.style.width = STAR_WIDTH * json.avg_score / MAX_RATING + 'px';
    return starDiv;
  }

  function createImage(json) {
    let itemPicture = document.createElement('img');
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
    document.getElementById('items').classList.add('hidden');
    let item = document.createElement('article');
    let itemTitle = document.createElement('h2');
    itemTitle.textContent = json.item_name;
    item.appendChild(itemTitle);
    let itemContainer = document.createElement('div');
    itemContainer.id = 'itemContainer';
    let itemPicture = createImage(json);
    itemContainer.appendChild(itemPicture);
    let descContainer = document.createElement('div');
    let price = document.createElement('p');
    price.classList.add('price');
    price.textContent = 'Price: Ɖ' + json.price;
    descContainer.appendChild(price);
    descContainer.appendChild(createStarRating(json));
    let form = document.createElement('form');
    let textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.min = '1';
    textInput.max = json.quantity;
    textInput.id = 'quantity';
    form.appendChild(textInput);
    let label = document.createElement('label');
    label.for = textInput.id;
    label.textContent = json.quantity > 10 ? ' More than 10 available' : json.quantity +
    ' available';
    form.appendChild(label);
    descContainer.appendChild(form);
    let category = document.createElement('p');
    category.textContent = 'Category: ' + json.category;
    category.classList.add('category');
    descContainer.appendChild(category);
    let buyBtn = document.createElement('button');
    buyBtn.classList.add('green');
    buyBtn.textContent = 'Buy';
    descContainer.appendChild(buyBtn);
    let description = document.createElement('p');
    description.id = 'description';
    description.textContent = 'Description:';
    descContainer.appendChild(description);
    let descriptionContent = document.createElement('p');
    descriptionContent.textContent = json.description;
    descContainer.appendChild(descriptionContent);
    itemContainer.appendChild(descContainer);
    item.appendChild(itemContainer);
    let feedbacks = document.createElement('section');
    feedbacks.id = 'feedbacks';
    let reviews = document.createElement('h2');
    reviews.textContent = 'Reviews:';
    feedbacks.append(reviews);
    for (let i = 0; i < json.feedbacks.length; i++) {
      let feedback = document.createElement('article');
      feedback.appendChild(createStarRating(json.feedbacks[i]));
      if (json.feedbacks[i].description !== undefined) {
        let feedbackContent = document.createElement('p');
        feedbackContent.textContent = json.feedbacks[i].description;
        feedback.appendChild(feedbackContent);
      }
      feedbacks.appendChild(feedback);
    }
    item.appendChild(feedbacks);
    document.getElementById('item').appendChild(item);
    document.getElementById('item').classList.remove('hidden');
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
    document.getElementById('items').classList.remove('hidden');
    document.getElementById('item').innerHTML = '';
    document.getElementById('item').classList.add('hidden');
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