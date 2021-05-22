/* eslint-disable */

// @bable/polyfill is added to convert latest JS features, to es5 and less that compatiable for all the browsers
import '@babel/polyfill';

// When calling any of our natours api from front we used to call those api's like this '127.0.0.1:3000/api/....'. For production deployment removed the hostname and port number '127.0.0.1:3000' because our front end and backend will be deployed on the same heroku server so front end api calls will be prefixed with the correct hostname and portname
import { displayMap } from './mapBox';
import { loginHandler, logoutHandler } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logout = document.querySelector('.nav__el--logout');
const updateData = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

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
    // creating new FormData() object to accomodate file uploads
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    // files[0] denotes single file uploaded. If there are multiple uploads then this array will have multiple eleemnts in it.
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'profile');
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

if (bookBtn) {
  bookBtn.addEventListener('click', async event => {
    event.target.textContent = 'Processing...';
    const { tourId } = event.target.dataset;
    await bookTour(tourId);
    event.target.textContent = 'book tour now!';
  });
}
