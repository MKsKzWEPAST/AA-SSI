import * as fs from "node:fs";

import { setZKPRequest }  from '../contracts/scripts/deploy_zkp';

function getLastZKPDate(): Date | null {
    try {
        const data = fs.readFileSync('./ZKPDate.json', 'utf8');
        const parsedData = JSON.parse(data);
        return new Date(parsedData.lastUpdated);
    } catch (error) {
        console.error('ZKPDate.json didn\'t exist or wasn\'t properly formatted.');
        return null;
    }
}

function saveDateToFile(date: Date) {
    const data = JSON.stringify({ lastUpdated: date.toISOString() });
    fs.writeFileSync('./ZKPDate.json', data);
    console.log('Current date saved to ZKPDate.json');
}

async function setZKPnWrite(currentDate: Date) {
    console.log(`Setting ZKP Request to ${currentDate.toISOString()}`);
    await setZKPRequest();
    console.log(`Date set!`);
    saveDateToFile(currentDate);
}

export async function maintainZKPRequest() {
    const currentDate = new Date();
    const lastZKPDate = getLastZKPDate();

    if (!lastZKPDate || isNaN(lastZKPDate.getTime()) || lastZKPDate.getTime() > currentDate.getTime()) {
        await setZKPnWrite(currentDate);
    } else if (currentDate.getTime() > lastZKPDate.getTime()
        && currentDate.getDate() != lastZKPDate.getDate()) {
        await setZKPnWrite(currentDate);
    }

    const midnight = new Date();
    midnight.setHours(0, 0,0, 0);
    midnight.setDate(midnight.getDate() + 1);
    setTimeout(() => {
        console.log("hi");
        setZKPnWrite(new Date());
    }, midnight.getTime() - currentDate.getTime() + 1000 * 60 ); // called on next midnight (+ 1 minute)

    return setInterval(() => {
        setZKPnWrite(new Date());
    }, 1000 * 60 * 60 * 24); // called every 24h
}