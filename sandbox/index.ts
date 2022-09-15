import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
    await client.hSet('airplane', {
        color: 'red',
        year: 1985,
        
    });

    const airplane = await client.hGetAll('airplane');

    if(Object.keys(airplane).length === 0) {
        console.log('Airplane not found. 404.');
        return;
    }
    console.log(airplane);
};
run();
