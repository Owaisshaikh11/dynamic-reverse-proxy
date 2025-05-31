const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('Hello from testuser!');
});

app.get('/health', (req, res) => {
  res.send('healthy');
});

app.listen(port, () => {
  console.log(`Test app running on port ${port}`);
});
