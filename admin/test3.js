const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5070,
  path: '/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const cookies = res.headers['set-cookie'];
    console.log("Login res:", data);

    const statsOptions = {
      hostname: 'localhost',
      port: 5070,
      path: '/admin/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Cookie': cookies[0]
      }
    };
    http.get(statsOptions, (statsRes) => {
        let statsData = '';
        statsRes.on('data', (chunk) => { statsData += chunk; });
        statsRes.on('end', () => {
            console.log("Stats res length:", statsData.length);
            console.log("Stats res sample:", statsData.substring(0, 150));
            try {
               let json = JSON.parse(statsData);
               console.log("Keys:", Object.keys(json.stats));
            } catch(e) {}
        });
    });
  });
});

req.write(JSON.stringify({email: 'admin@gmail.com', password: 'admin@123', role: 'admin'}));
req.end();
