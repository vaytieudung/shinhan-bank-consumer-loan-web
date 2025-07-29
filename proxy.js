const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer(function(req, res) {
  if (req.url.startsWith('/models/')) {
    proxy.web(req, res, { target: 'https://www.shinhanfinancer.com' });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(9000, () => {
  console.log('Proxy server listening on port 9000');
});
