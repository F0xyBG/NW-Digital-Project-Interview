import * as restify from 'restify';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const server = restify.createServer();

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/hello/:name', (req, res, next) => {
  res.send({ message: 'Hello ' + req.params.name });
  return next();
});
 

server.post('/chat', async (req, res) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: req.body.messages,
    });
    console.log('Response:', response);
    res.send(response.choices[0].message);
  } catch (error) {
    console.error('Error:', error);
    res.send(500, { error: 'Internal Server Error' });
  }
  
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});