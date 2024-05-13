import * as fs from "node:fs";
// @ts-ignore
import setZKPRequest from '../contracts/scripts/deploy_zkp';

function getLastZKPDate(): Date | null {
    try {
        const data = fs.readFileSync('./ZKPDate.json', 'utf8');
        const parsedData = JSON.parse(data);
        return new Date(parsedData.lastUpdated);
    } catch (error) {
        console.error('Error reading or parsing ZKPDate.json:', error);
        return null;
    }
}

function saveDateToFile(date: Date) {
    const data = JSON.stringify({ lastUpdated: date.toISOString() });
    fs.writeFileSync('./ZKPDate.json', data);
    console.log('Current date saved to ZKPDate.json');
}

export async function maintainZKPRequest() {
    const currentDate = new Date();
    const lastZKPDate = getLastZKPDate();

    if (!lastZKPDate || isNaN(lastZKPDate.getTime()) || lastZKPDate.getDate() > currentDate.getDate()) {
        setZKPRequest();
        saveDateToFile(currentDate);
    }else if (currentDate.getDate() > lastZKPDate.getDate()) {
            setZKPRequest();
            saveDateToFile(new Date());
    } else {
        console.log('No action needed.');
    }

    const midnight = new Date();
    midnight.setHours(0, 0,0, 0);
    midnight.setDate(midnight.getDate() + 1);
    return setTimeout(() => {
        setZKPRequest();
        saveDateToFile(new Date());
        return setInterval(() => {
            setZKPRequest();
            saveDateToFile(new Date());
        }, 1000 * 60 * 60 * 24); // called every 24h
    }, midnight.getTime() - currentDate.getTime()); // called on next midnight
}