/* eslint-disable */

const loginHandler = async event => {
  // prevent default behaviour of form to reload the page
  event.preventDefault();
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const response = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (response.data.status === 'success') {
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    console.log(error.response.data);
  }
};

document.querySelector('.form').addEventListener('submit', loginHandler);
