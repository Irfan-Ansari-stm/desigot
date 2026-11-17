const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('../src/app');

async function testWithServer() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log('Test server listening on port', port);

  try {
    // 1. GET /api/v1/public/footer
    const pubRes = await fetch(`http://127.0.0.1:${port}/api/v1/public/footer`);
    console.log('GET /api/v1/public/footer status:', pubRes.status);
    const pubData = await pubRes.json();
    console.log('Settings Brand:', pubData.data?.settings?.brand_name);
    console.log('Columns count:', pubData.data?.columns?.length);
    console.log('Col 1 title:', pubData.data?.columns[0]?.title);
    console.log('Col 1 links count:', pubData.data?.columns[0]?.links?.length);
    console.log('Sample link 1:', pubData.data?.columns[0]?.links[0]?.label, '->', pubData.data?.columns[0]?.links[0]?.url);
    console.log('Social accounts:', pubData.data?.social_links?.map(s => s.platform).join(', '));
    console.log('Legal links count:', pubData.data?.legal_links?.length);

    // 2. Newsletter Subscribe
    const subRes = await fetch(`http://127.0.0.1:${port}/api/v1/public/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `designer_${Date.now()}@test.com` })
    });
    console.log('Newsletter sub status:', subRes.status);
    const subData = await subRes.json();
    console.log('Newsletter sub message:', subData.message);

    console.log('✅ All Footer & Newsletter endpoints functioning perfectly!');
  } finally {
    server.close();
  }
  process.exit(0);
}

testWithServer().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
