require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PAYSTACK_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const config = {
    headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
};

// 1. GATEWAY TO START PAYMENT
app.post('/initialize-payment', async (req, res) => {
    const { email, amount, currency, isSubscription, planCode } = req.body;
    try {
        const payload = {
            email,
            amount: Math.round(amount * 100), // Converts to subunits (Kobo/Pesewas)
            currency: currency.toUpperCase()
        };

        if (isSubscription && planCode) {
            payload.plan = planCode;
        }

        const response = await axios.post(`${PAYSTACK_URL}/transaction/initialize`, payload, config);
        res.status(200).json({ paymentLink: response.data.data.authorization_url });
    } catch (error) {
        res.status(500).json({ error: error.response?.data?.message || "OddsAura Server Error" });
    }
});

// 2. GATEWAY TO VERIFY PAYMENT
app.get('/verify/:reference', async (req, res) => {
    const { reference } = req.params;
    try {
        const response = await axios.get(`${PAYSTACK_URL}/transaction/verify/${reference}`, config);
        const data = response.data.data;

        if (data.status === 'success') {
            res.json({ 
                status: "Success", 
                message: "OddsAuraAi Access Granted", 
                details: { amount: data.amount / 100, currency: data.currency }
            });
        } else {
            res.status(400).json({ status: "Failed", message: "Payment incomplete" });
        }
    } catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
});

app.listen(process.env.PORT, () => console.log(`OddsAuraAi Backend is ONLINE on port ${process.env.PORT}`));
