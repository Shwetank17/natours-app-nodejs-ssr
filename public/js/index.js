/* eslint-disable */

// @bable/polyfill is added to convert latest JS features, to es5 and less that compatiable for all the browsers
import '@babel/polyfill';

import { displayMap } from './mapBox';
import { loginHandler, logoutHandler } from './login';
import { updateData } from './updateSettings';

// DOM ELEMENTS
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logout = document.querySelector('.nav__el--logout');
const updateSettings = document.querySelector('.form-user-data');

// DELEGATION OF WORK TO RESPECTIVE HANDLERS
if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    // prevent default behaviour of form to reload the page on submission
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginHandler(email, password);
  });
}

if (logout) {
  logout.addEventListener('click', () => {
    logoutHandler();
  });
}

if (updateSettings) {
  updateSettings.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateData(name, email);
  });
}
