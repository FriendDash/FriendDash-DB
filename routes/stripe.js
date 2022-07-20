const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SK);

router.post('/:stripeId/create-checkout-session', async (req, res) => {
  if (!req.params.stripeId) {
    return res.status(400).send('Bad id given');
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    payment_method_types: ['card'],
    success_url:
      'https://frienddash.herokuapp.com/stripe/success?sessionId={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://frienddash-db.herokuapp.com/payment',
    customer: req.params.stripeId,
  });
  res.redirect(session.url);
});

router.get('/success', async (req, res) => {
  // const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
  res.redirect('https://frienddash-db.herokuapp.com/payment');
});

router.get('/paymentMethods/:stripeId', async (req, res) => {
  if (req.params.stripeId === undefined) {
    return res.status(400).send('Bad id given');
  }
  const paymentMethods = await stripe.customers.listPaymentMethods(
    req.params.stripeId,
    { type: 'card' }
  );
  res.send(paymentMethods);
});

module.exports = router;
