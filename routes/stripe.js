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
      'https://frienddash-db.herokuapp.com/stripe/success?sessionId={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://frienddash.herokuapp.com/payment',
    customer: req.params.stripeId,
  });
  res.redirect(session.url);
});

router.get('/success', async (req, res) => {
  // const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
  res.redirect('https://frienddash.herokuapp.com/payment');
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

router.delete('/paymentMethods/:cardId', async (req, res) => {
  if (req.params.cardId === undefined || req.params.cardId === null) {
    return res.status(400).send('Bad card id given');
  }
  const deletedCard = await stripe.paymentMethods.detach(
    req.params.cardId
  );
  res.status(204).send(deletedCard);
});

router.post('/paymentMethods/:cardId', async (req, res) => {
  if (req.params.cardId === undefined || req.params.cardId === null) {
    return res.status(400).send('Bad card id given');
  }
  if (req.body == undefined || req.body == null) {
    return res.status(200);
  }
  const updatedCard = await stripe.paymentMethods.update(
    req.params.cardId,
    req.body
  )
  res.status(200).send(updatedCard);
})

module.exports = router;

router.post('/accountLink/:id', async (req, res) => {
  if (req.params.id == undefined || req.params.id == null) {
    return res.status(400);
  }
  
  const accountLink = await stripe.accountLinks.create({
    account: req.params.id,
    refresh_url: 'http://localhost:3000/payment',
    return_url: 'http://localhost:3000',
    type: 'account_onboarding',
  });
  res.redirect(accountLink.url);
})
