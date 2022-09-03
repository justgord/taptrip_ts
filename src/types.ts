//
// taptrip types
//


export enum Stop { S1=1, S2, S3 };

export enum TapIO { I="I", O="O"}; 

export const TapON  = TapIO.I;
export const TapOFF = TapIO.O;


export type Tap =
{
    ts: string;         // timestamp/date
    id: string;         // user/card id
    tap: TapIO;
    stop: Stop;
};

export type Trip = 
{
    id: string;         // user/card id
    tap_on:Tap;
    tap_off:Tap;
    cost:number;
    note:string;
}


export interface ITripCosts 
{
    trip(stopA:Stop, stopB:Stop) : number;      // cost of travel from A -> B

    max(stopA:Stop) : number;                   // max cost of trip to/from stop
}


export interface ITapSink
{
    send(tap:Tap);                              // send/write a new tap into the sink

    done();                                     // no more taps to send
}

export interface ITripSink
{
    send(trip:Trip);

    done();
}





