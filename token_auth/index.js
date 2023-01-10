const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';
const clientId = 'JIvCO5c2IBHlAe2patn6l6q5H35qxti0';
const clientSecret = 'ZRF8Op0tWM36p1_hxXTU-B0K_Gq_-eAVtlrQpY24CasYiDmcXBhNS6IJMNcz1EgB';
const domain = 'https://kpi.eu.auth0.com';
const audience = 'https://kpi.eu.auth0.com/api/v2/';

app.use(async (req, res, next) => {
    let token = req.get(SESSION_KEY);

    if (token) {
        const [, access_token] = token.split(' ');
        const pemRes = await fetch(`${domain}/pem`);
        const pem = await pemRes.text();
        try {
            jwt.verify(access_token, pem);
        } catch {
            return res.status(403).end();
        }
    }

    let userRes;
    try {
        userRes = await fetch(`${domain}/userinfo`, {
            headers: {
                'Authorization': token
            }
        });
    } catch {
        
    }
    
    if (userRes.ok) {
        const user = await userRes.json();
        req.user = user;
        console.log(user);
    }

    next();
});

app.get('/', (req, res) => {
    if (req.user) {
        return res.json(req.user)
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    const authRes = await fetch('https://kpi.eu.auth0.com/oauth/token', {
        method: 'POST',
        body: new URLSearchParams({
            username: login,
            password,
            audience: audience,
            grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
            client_id: clientId,
            client_secret: clientSecret,
            realm: 'Username-Password-Authentication',
            scope: 'openid'
        })
    });

    const auth = await authRes.json();

    if (auth.access_token) {
        res.json(auth);
    }

    res.status(401).send();
});

app.post('/api/callback', async (req, res) => {
    const { code } = req.body;

    const payload = {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: 'http://localhost:3000'
    };

    const authRes = await fetch('https://kpi.eu.auth0.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const auth = await authRes.json();
    
    if (auth.access_token) {
        res.json(auth);
    }

    res.status(401).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
