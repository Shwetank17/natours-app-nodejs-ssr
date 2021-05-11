/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export const updateData = async (name, email) => {
  console.log('FEE', name, email);
  try {
    const response = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name,
        email
      }
    });
    if (response.data.status === 'success') {
      showAlert('success', 'Profile updated successfully!');
      setTimeout(() => {
        location.reload(true);
      }, 2000);
    }
  } catch (error) {
    console.log('ERROR calling updateMe', error.response.data);
    showAlert(error.response.data);
  }
};

// axios.request(config)
// axios.get(url[, config])
// axios.delete(url[, config])
// axios.head(url[, config])
// axios.options(url[, config])
// axios.post(url[, data[, config]])
// axios.put(url[, data[, config]])
// axios.patch(url[, data[, config]])
