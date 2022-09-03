//
//  taptrip : src/test.ts
//

import { Stop, TapON, TapOFF, Tap, Trip, ITripCosts, ITapSink, ITripSink } from "./types";
import { CSVTapReader, CSVTripWriter } from "./csv";
import { FixedTripCosts, TripProcessor } from "./proc";

const lerr = console.error;

///

function nrand(K)
{
    return Math.floor(Math.random()*K);
}

function rand_elt(rg)
{
    return rg[nrand(rg.length)];
}


function rand_taps_into(sink:ITapSink,N=1000)
{
    function rand_id()
    {
        return 1001+nrand(50)+nrand(50);
    }

    let tm=2001;

    function rand_ts()
    {
        let dt = nrand(10)+nrand(10);       // monotonic clock
        tm += dt;
        return tm;
    }

    function rand_tap()
    {
        return rand_elt([TapON, TapOFF]);
    }

    function rand_stop()
    {
        return rand_elt([Stop.S1, Stop.S2, Stop.S3]);
    }
    

    function gen_rand_tap() : Tap
    {
        return {id:rand_id().toString(), ts:rand_ts().toString(), tap:rand_tap(), stop:rand_stop()};
    }

    // make lots of random taps

    lerr("generating taps : "+N);

    for (let i=0;i<N;i++)
    {
        let tap:Tap = gen_rand_tap();

        //lerr(tap);

        sink.send(tap);
    }
    sink.done();
}


function process_taps()
{
    let csv_write   = new CSVTripWriter("rand_trips.csv");

    let costs       = new FixedTripCosts();

    let processor   = new TripProcessor(costs, csv_write);

    rand_taps_into(processor);
}

process_taps();


