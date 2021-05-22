/* eslint-disable */

export const hideAlert = () => {
  const alertOnDom = document.querySelector('.alert');
  if (alertOnDom) {
    alertOnDom.parentElement.removeChild(alertOnDom);
  }
};

export const showAlert = (type, message) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(() => {
    hideAlert();
  }, 5000);
};
