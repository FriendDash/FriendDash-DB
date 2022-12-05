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
      'https://frienddash-db.onrender.com/stripe/success?sessionId={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://frienddash.vercel.app/payment',
    customer: req.params.stripeId,
  });
  res.redirect(session.url);
});

router.get('/success', async (req, res) => {
  // const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
  res.redirect('https://frienddash.vercel.app/payment');
});

router.get('/paymentMethods/:stripeId', async (req, res) => {
  if (req.params.stripeId === undefined) {
    return res.status(400).send('Bad id given');
  }
  const paymentMethods = await stripe.customers
    .listPaymentMethods(req.params.stripeId, { type: 'card' })
    .then(response => res.send(response))
    .catch(err => res.status(500));
});

router.delete('/paymentMethods/:cardId', async (req, res) => {
  if (req.params.cardId === undefined || req.params.cardId === null) {
    return res.status(400).send('Bad card id given');
  }
  const deletedCard = await stripe.paymentMethods
    .detach(req.params.cardId)
    .then(response => res.status(204).send(response))
    .catch(err => res.status(500));
});

router.post('/paymentMethods/:cardId', async (req, res) => {
  if (req.params.cardId === undefined || req.params.cardId === null) {
    return res.status(400).send('Bad card id given');
  }
  if (req.body == undefined || req.body == null) {
    return res.status(200);
  }
  const updatedCard = await stripe.paymentMethods
    .update(req.params.cardId, req.body)
    .then(response => res.send(response))
    .catch(err => res.status(500));
});

module.exports = router;

router.post('/accountLink/:id', async (req, res) => {
  if (req.params.id == undefined || req.params.id == null) {
    return res.status(400);
  }

  const accountLink = await stripe.accountLinks.create({
    account: req.params.id,
    refresh_url: 'https://frienddash.vercel.app/payment',
    return_url: 'https://frienddash.vercel.app/payment',
    type: 'account_onboarding',
  });
  res.redirect(accountLink.url);
});

router.get('/accounts/:id', async (req, res) => {
  if (req.params.id == undefined || req.params.id == null) {
    return res.status(400);
  }

  const account = await stripe.accounts
    .retrieve(req.params.id)
    .then(response => res.send(response))
    .catch(err => res.status(500));
});

router.post('/checkout', async (req, res) => {
  if (
    !req.body.userStripeId ||
    !req.body.amount ||
    !req.body.paymentMethodId ||
    !req.body.receiverId
  ) {
    return res.status(400).send({ message: 'missing body fields' });
  }

  const paymentIntent = await stripe.paymentIntents
    .create({
      amount: req.body.amount,
      currency: 'cad',
      confirm: true,
      customer: req.body.userStripeId,
      payment_method: req.body.paymentMethodId,
      transfer_data: {
        amount: req.body.amount,
        destination: req.body.receiverId,
      },
      return_url: 'https://frienddash.vercel.app/',
    })
    .then(response => res.send(response))
    .catch(err => res.send(500));
});
