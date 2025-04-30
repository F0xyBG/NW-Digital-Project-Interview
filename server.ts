import * as restify from 'restify';

const server = restify.createServer();

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/hello/:name', (req, res, next) => {
  res.send({ message: 'Hello ' + req.params.name });
  return next();
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});