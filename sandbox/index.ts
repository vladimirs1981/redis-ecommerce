import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
    await client.hSet('airplane1', {
        color: 'red',
        year: 1985,
        
    });
    await client.hSet('airplane2', {
        color: 'blue',
        year: 1923,
        
    });
    await client.hSet('airplane3', {
        color: 'green',
        year: 1960,
        
    });

  const results =  await Promise.all([
        client.hGetAll('airplane1'),
        client.hGetAll('airplane2'),
        client.hGetAll('airplane3')
    ]);
    console.log(results);
};
run();
