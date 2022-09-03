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
    private ntrips:number = 0;       

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

    private stor(tap:Tap)
    {
        this.last_taps.set(tap.id,tap);
    }
    
    private clear(tap:Tap)
    {
        this.last_taps.delete(tap.id);
    }

    private emit_trip(lst:Tap, cur:Tap, cost:number, note:string)
    {
        lerr("Trip       "+cur.id+"     "+lst.tap+"."+lst.stop+" -> "+cur.tap+"."+cur.stop+" : $ "+cost.toFixed(2)+" : "+note);

        let trip:Trip = {id:cur.id,tap_on:lst,tap_off:cur,cost:cost, note:note };

        this.ntrips++;

        this.writer.send(trip);
    }

    private check_trip(lst:Tap, cur:Tap)
    {
        const _=this;

        function tap_on()
        {
            _.stor(cur);
        }

        function trip_complete()
        {
            if (lst.stop == cur.stop)
            {
                lerr("Trip       "+cur.id+"     "+lst.tap+"."+lst.stop+" -> "+cur.tap+"."+cur.stop+" : $ 0.00 : cancelled trip");
                _.clear(cur);
                return;
            }

            let cost = _.costs.trip(lst.stop,cur.stop);
            _.emit_trip(lst,cur,cost,"completed trip");
            _.clear(cur);
        }

        function trip_missing_tap_on()
        {
            let cost = _.costs.max(cur.stop);
            _.emit_trip(cur,cur,cost,"missing tap ON");
            _.clear(cur);
        }

        function trip_missing_tap_off()
        {
            let cost = _.costs.max(lst.stop);
            _.emit_trip(lst,cur,cost,"missing tap OFF");
            _.stor(cur);
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

    private check_remaining()
    {
        // close any active trips, assuming they forgot to tap off

        const _=this;
        lerr("remaining : "+_.last_taps.size);

        for (let [id, tap] of _.last_taps)
        {
            lerr("tap : "+[tap.ts, tap.id, tap.tap, tap.stop].join(" "));
            let cost = _.costs.max(tap.stop);
            _.emit_trip(tap,tap,cost,"missing tap OFF");
        }
        _.last_taps.clear();
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
        this.check_remaining();

        lerr("processed : "+this.ntaps+" taps  ->  "+this.ntrips+" trips");
    }

}
