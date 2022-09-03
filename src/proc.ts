//
//  taptrip : src/app.ts
//

import { Stop, TapON, TapOFF, Tap, Trip, ITripCosts, ITapSink, ITripSink } from "./types";
import { CSVTapReader, CSVTripWriter } from "./csv";
import assert from "assert-ts";

const lerr = console.error;

///


export class FixedTripCosts implements ITripCosts
{
    private _costs;         // travel costs matrix between each stop
    private _costs_max;     // max travel cost to/from given stop

    constructor() {

        let costs=[[],[],[],[]];

        costs[1][2]=costs[2][1]=3.25;
        costs[2][3]=costs[3][2]=5.50;
        costs[1][3]=costs[3][1]=7.30;

        costs[1][1]=costs[2][2]=costs[3][3]=0.0;
        costs[1][0]=costs[2][0]=costs[3][0]=0.0;

        this._costs = costs;

        function maxper(r:Stop)
        {
            var mx = Math.max( ... costs[r]);
            //lerr("max per Stop"+r+" : "+mx);
            return mx;
        }

        this._costs_max = [ 0, maxper(1), maxper(2), maxper(3)];
    }

    // ITripCosts impl

    trip(stopA:Stop, stopB:Stop) : number
    {
        return this._costs[stopA][stopB];
    }

    max(stopA:Stop) : number
    {
        return this._costs_max[stopA];
    }
}



export class TripProcessor implements ITapSink
{
    private ntaps:number = 0;       

    private costs:ITripCosts;
    private writer:ITripSink;

    private last_taps:Map<String, Tap>;

    constructor(costs:ITripCosts, writer:ITripSink)
    {
        lerr();
        lerr("trip processor : ");
        this.costs  = costs;
        this.writer = writer;

        this.last_taps = new Map<String, Tap>();
    }

    stor(tap:Tap)
    {
        this.last_taps.set(tap.id,tap);
    }
    
    clear(tap:Tap)
    {
        this.last_taps.delete(tap.id);
    }

    emit_trip(lst:Tap, cur:Tap, cost:number, note:string)
    {
        lerr("Trip       "+cur.id+"     "+lst.tap+"."+lst.stop+" -> "+cur.tap+"."+cur.stop+" : $ "+cost.toFixed(2)+" : "+note);

        let trip:Trip = {id:cur.id,tap_on:lst,tap_off:cur,cost:cost, note:note };

        this.writer.send(trip);
    }


    check_trip(lst:Tap, cur:Tap)
    {
        const _=this;
    
        function stor()
        {
            _.last_taps.set(cur.id,cur);
        }

        function clear()
        {
            _.last_taps.delete(cur.id);
        }

        function tap_on()
        {
            stor();
        }

        function trip_complete()
        {
            if (lst.stop == cur.stop)
            {
                lerr("Trip       "+cur.id+"     "+lst.tap+"."+lst.stop+" -> "+cur.tap+"."+cur.stop+" : $ 0.00 : cancelled trip");
                clear();
                return;
            }

            let cost = _.costs.trip(lst.stop,cur.stop);
            _.emit_trip(lst,cur,cost,"completed trip");
            clear();
        }

        function trip_missing_tap_on()
        {
            let cost = _.costs.max(cur.stop);
            _.emit_trip(cur,cur,cost,"missing tap ON");
            clear();
        }

        function trip_missing_tap_off()
        {
            let cost = _.costs.max(lst.stop);
            _.emit_trip(lst,cur,cost,"missing tap OFF");
            stor();
        }

        //    -   ON    : tap_on
        //    ON  OFF   : trip_complete
        //    -   OFF   : trip_missing_tap_on
        //    ON  ON    : trip_missing_tap_off

        if (!lst)
        { 
            if (cur.tap==TapON)
            {
                tap_on();
                return;
            }
            if (cur.tap==TapOFF)
            {
                trip_missing_tap_on();
                return;
            }
        }
        else 
        {
            if (lst.tap==TapON && cur.tap==TapOFF)
            {
                trip_complete();
                return;
            }
            if (lst.tap==TapON && cur.tap==TapON)
            {
                trip_missing_tap_off();
                return;
            }
        }

        assert(false,"unhandled state");

        //lerr("    : max cost : "+this.costs.max(tap.stop));
    }

    // ITapSink impl
    
    send(tap:Tap)
    {
        this.ntaps++;

        lerr("tap : "+[tap.ts, tap.id, tap.tap, tap.stop].join(" "));

        let lst:Tap = this.last_taps.get(tap.id); 

        this.check_trip(lst,tap);
    }
        
    done()
    {
        const _=this;

        lerr("processed : "+_.ntaps+" taps");
        lerr();

        // close any active trips, assuming they forgot to tap off

        lerr("remaining : "+_.last_taps.size);

        for (let [id, tap] of _.last_taps)
        {
            lerr("tap : "+[tap.ts, tap.id, tap.tap, tap.stop].join(" "));
            let cost = _.costs.max(tap.stop);
            _.emit_trip(tap,tap,cost,"missing tap OFF");
        }
    }
}
