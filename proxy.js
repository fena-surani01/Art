const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// Forward /admin/* to admin app, re-adding the /admin prefix Express strips
app.use('/admin', createProxyMiddleware({
    target: 'http://localhost:5070',
    changeOrigin: true,
    pathRewrite: (path, req) => '/admin' + path
}));

// Everything else goes to user app
app.use('/', createProxyMiddleware({
    target: 'http://localhost:6070',
    changeOrigin: true
}));

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});