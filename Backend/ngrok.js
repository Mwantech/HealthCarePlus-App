const ngrok = require('ngrok');

(async function () {
  const url = await ngrok.connect(3001);
  console.log('Public URL:', url);
})();
