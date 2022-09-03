//
//  CSVTapReader   reads in CSV file, sends Taps to ITapSink
//  CSVTripWriter  is a ITripSink which writes Trips to CSV file
//

import * as fs from 'fs';
import { parse } from 'csv-parse';
import assert from "assert-ts";

import { Stop, TapON, TapOFF, Tap, ITapSink, Trip, ITripSink } from './types';


class LogSink implements ITapSink
{
    count:number = 0;

    send(tap:Tap)
    {
        this.count++;
        console.error("tap : "+[tap.ts, tap.id, tap.tap, tap.stop].join(" "));
    }

    done()
    {
        console.error("done : "+this.count+" rows");
    }
}

function tap_from_csv(s:String) : Tap
{
    let rec = s.split(",");
    if (rec.length<4)
        return null;

    let ts  = rec[0];
    let id  = rec[1];
    let tap = rec[2];
    let stop= +rec[3];

    if (stop<Stop.S1 || stop>Stop.S3)
        return null;

    if (!ts.length || ts=="ts")
        return null;

    if (tap!=TapON && tap!=TapOFF)
        return null;

    return {ts,id,tap,stop};
}

let tapok = tap_from_csv("1003,4001,I,3");
let badh : Tap = tap_from_csv("ts,id,tap,stop");
let badb : Tap = tap_from_csv("");

assert(tapok, "tapok should be valid, but isnt");
assert(!badh, "header is not a valid tap");
assert(!badb, "blank  is not a valid tap");



async function csv_tap_reader(sfile, sink:ITapSink)
{
    let parser = parse({columns: true});
    fs.createReadStream(sfile).pipe(parser);

    for await (const record of parser) {

        // aahh.. we just want the csv line / values
    
        let srec:String[] = [];
        for (const k in record)
            srec.push(record[k]);
            
        let tap:Tap = tap_from_csv(srec.join(','));    
        if (tap)
            sink.send(tap);
    }           
                
    sink.done();
}

function test_log()
{
    let tap_sink = new LogSink(); 
    csv_tap_reader("taps.csv", tap_sink);
}
//test_log();



export class CSVTapReader
{
    private _file:string;

    constructor(sfile:string)
    {
        this._file = sfile;
    }

    async read_into(sink:ITapSink)
    {
        csv_tap_reader(this._file, sink); 
    }
}


///


const CSV_OUT_HEADERS = ["id","from_ts","from_tap","from_stop","to_ts","to_tap","to_stop","cost"];

export class CSVTripWriter implements ITripSink
{
    private csv;

    constructor(sfile:string)
    {
        // open file, write headers

        this.csv = fs.createWriteStream(sfile);
        //this.csv.open();
        this.csv.write(CSV_OUT_HEADERS.join(",")+"\n");
    }

    // ITripSink impl

    send(t:Trip)
    {
        let lst = t.tap_on;
        let cur = t.tap_off;
        let rec = [cur.id,lst.ts,lst.tap,lst.stop, cur.ts,cur.tap,cur.stop, t.cost.toFixed(2)];
        this.csv.write(rec.join(",")+"\n");
    }

    done()
    {
        this.csv.close();
    }

}


