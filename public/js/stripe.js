/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourId => {
  const stripe = Stripe(
    'pk_test_51Iri8xSBJiF89tofeRhnpys5zMYrL8R13hJRwiZL61sZtEP4qKJLL4PJ4q84j305SdEAnezW7moYwmBda4r7e1qW00VooWjSTG'
  );
  try {
    // Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`
    });
    // Create checkout form and charge the credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
