

    readme.txt

        taptrip : code exercise

        gord anderson 
        2022-09-01



    Files : 

        ./taps.csv          // input  CSV : ts,id,tap,stop

        ./trips.csv         // output CSV : id,from_ts,from_tap,from_stop,to_ts,to_tap,to_stop,cost

        ./rand_trips.csv    // trips from random taps test
    

    Code : 

        ./src/types.ts      // types and interfaces
        ./src/proc.ts       // main processing and costs logic
        ./src/csv.ts        // CSV file processing
        ./src/app.ts        // reads taps.csv use cases, outputs trips.csv
        ./src/test.ts       // generates random taps, makes trips, outputs rand_trips.csv


    Install and run: 

        npm install

        npx tsc

        // run sample data / case tests

        npm start           
        node dist/app.js

        // run 1000 random taps test

        npm test
        node dist/test.js


    Logic / Algorithm

        Keep a map of last tap per user id [ aka card# / pan ]
        As taps are read in from ./taps.csv, take actions based on last and current taps : 
    
            state action plan : 

            lst     cur     action                      note 
            ---     ---     ---------------------       ----------
            -   ->  I                                  store tap ON for this user id/pan
            -   ->  O      trip_missing_tap_on         tap OFF with no prior tap ON
            I   ->  O      trip_complete               charge or cancel if at same stop ]
            I   ->  I      trip_missing_tap_off        tap ON with no prior tap OFF

            notation :         
                lst is previous tap [ for a given user/card id ] 
                cur is current tap     ""
                I/IN is tap ON, 
                O/OUT is tap OFF
                '-' is shorthand for no prior tap


    Design

        Processing pipeline : 

            [ taps.csv ] -> CSVTapReader -> ITapSink : TripProcessor -> ITripSink : CSVTripWriter -> [ trips.csv ]


        Interfaces seperate concerns, so that eg. CSV processing is isolated from trip cost and tap/trip processing

            see ./src/types.ts

                ITapSink    gets fed Taps
                ITripSink   gets fed Trips

            Main logic for turning taps into trips and costing trips is in ./src/proc.ts

                FixedTripCosts
                TripProcessor

            CSV wrangling happens in ./src/csv.ts

                CSVTapReader   reads in CSV file, sends Taps to ITapSink
                CSVTripWriter  is a ITripSink which writes Trips to CSV file


            main app that takes taps.csv and generates trips.csv in in ./src/app.ts


            random test taps generated in ./src/test.ts

               rand_taps_into() -> ITapSink : TripProcessor -> ITripSink : CSVTripWriter -> [ rand_trips.csv ]



    Assumptions/Notes

        I use 'id' to mean user-id/card-id/PAN .. a string, so could accommodate CC numbers

        timestamps is assumed monotonic / strictly non-decreasing [ as input can be easily pre-sorted ] 
        I use integer timestamp 'ts' for taps and trips, for sake of brevity and ease of testing

        end-of-day processing happens at end of taps input, 
            unresolved trips are charged at that time, assuming those travellers forgot to tap off

        I dont compute duration, nor preserve other data such as companyName,busId - 
            these can be added later and are not central to the problem.

        costs between stops are essentially hard-coded, max costs to/from stop is computed from that
            
                 

    Sample run debug logging : 

        trip processor :
        tap : 1001 3003 I 3
        tap : 1002 3003 O 2
        Trip       3003     I.3 -> O.2 : $ 5.50 : completed trip
        tap : 1002 3003 I 2
        tap : 1003 3003 O 1
        Trip       3003     I.2 -> O.1 : $ 3.25 : completed trip
        tap : 1005 3003 I 1
        tap : 1007 2002 I 1
        tap : 1008 2002 O 2
        Trip       2002     I.1 -> O.2 : $ 3.25 : completed trip
        tap : 1010 9111 O 3
        Trip       9111     O.3 -> O.3 : $ 7.30 : missing tap ON
        tap : 1020 9113 I 3
        tap : 1025 9113 O 3
        Trip       9113     I.3 -> O.3 : $ 0.00 : cancelled trip
        tap : 1029 9113 O 2
        Trip       9113     O.2 -> O.2 : $ 5.50 : missing tap ON
        tap : 1020 9111 I 3
        tap : 1025 9111 I 2
        Trip       9111     I.3 -> I.2 : $ 7.30 : missing tap OFF
        tap : 1030 9222 I 3
        tap : 1032 9222 O 1
        Trip       9222     I.3 -> O.1 : $ 7.30 : completed trip
        tap : 1040 9333 O 3
        Trip       9333     O.3 -> O.3 : $ 7.30 : missing tap ON
        remaining : 2
        tap : 1005 3003 I 1
        Trip       3003     I.1 -> I.1 : $ 7.30 : missing tap OFF
        tap : 1025 9111 I 2
        Trip       9111     I.2 -> I.2 : $ 5.50 : missing tap OFF
        processed : 16 taps  ->  10 trips
