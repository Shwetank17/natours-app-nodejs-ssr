/* eslint-disable */

import axios from 'axios';

import { showAlert } from './alert';

export const loginHandler = async (email, password) => {
  try {
    const response = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (response.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.log('Error calling login', error.response.data);
  }
};

export const logoutHandler = async () => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });
    if (response && response.data.status === 'success') {
      showAlert('success', 'Logged out successfully!');
      location.reload(true); // browser will skip the cache and reload the page from the server. This is necessary in order for browser to send the latest cookied with value 'loggedout' to our express which in turn will treat the request as non-authenticated request
      location.replace('/login');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
