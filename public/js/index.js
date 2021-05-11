/* eslint-disable */

// @bable/polyfill is added to convert latest JS features, to es5 and less that compatiable for all the browsers
import '@babel/polyfill';

import { displayMap } from './mapBox';
import { loginHandler, logoutHandler } from './login';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logout = document.querySelector('.nav__el--logout');
const updateData = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-settings');

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
  logout.addEventListener('click', logoutHandler);
}

if (updateData) {
  updateData.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateSettings(
      {
        name,
        email
      },
      'profile'
    );
  });
}

if (updatePassword) {
  updatePassword.addEventListener('submit', async event => {
    event.preventDefault();
    document.querySelector('.btn--save-password').textContent =
      'Saving Password...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      {
        passwordCurrent,
        password,
        passwordConfirm
      },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').textContent = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
