/************************************************************************************//**
** Data (Module): 
*   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
*   in the instantiation and storage of various data point representations.
****************************************************************************************/
LineExtractionApp.Data = function () {

    /****************************************************************************************
    * Classes + Structs
    ****************************************************************************************/
    // a small struct to define an entire scan (360 degrees) worth of sensor readings
    let ScanDataStruct = function (sensorReadings, timeStamp) {
        this.sensorReadings = sensorReadings;
        this.timeStamp = (arguments.length < 2) ? Date.now() : timeStamp;
    };

    //a small struct to define polar coordinate
    function PolarCoordStruct(theAngle, theRadius) {
        this.angle = theAngle;
        this.radius = theRadius;
    };

    //a small struct to define a cartesian coordinate 
    function CartesianCoordStruct(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    // (Class) An individual data point reading from the sensor.
    // Includes both polar and cartesian representations.
    function SensorReading(theAngle, theDistance, theSignalStrength) {
        //store both the polar and cartesian forms of the data point
        this.polarCoord = new PolarCoordStruct(theAngle, theDistance);
        this.cartesianCoord = polar2Cart(theAngle, theDistance);

        this.signalStrength = theSignalStrength;
        this.timeStamp = Date.now();
    };

    //returns true if the data point is within the provided radius range (inclusive)
    SensorReading.prototype.isInRadiusRange = function (min, max) {
        let bBigEnough = this.polarCoord.radius >= min;
        let bSmallEnough = this.polarCoord.radius <= max;
        return bBigEnough && bSmallEnough;
    };

    //returns true if the data point is within the provided angle range (inclusive)
    SensorReading.prototype.isInAngleRange = function (min, max) {
        let bBigEnough = this.polarCoord.angle >= min;
        let bSmallEnough = this.polarCoord.angle <= max;
        return bBigEnough && bSmallEnough;
    };

    //returns true if the data point registered a signal strength within the provided range (inclusive)
    SensorReading.prototype.isInSignalStrengthRange = function (min, max) {
        let bBigEnough = this.signalStrength >= min;
        let bSmallEnough = this.signalStrength <= max;
        return bBigEnough && bSmallEnough;
    };

    SensorReading.prototype.toString = function () {
        let msg =
            `DataPoint:
            TimeStamp:  ${this.timeStamp}
            Signal Strength: ${this.signalStrength}
            PolarCoord: ${this.polarCoord.toString()}
            CartCoord: ${this.cartesianCoord.toString()}`;
        return msg;
    };


    /************************************************************************************//**
    ** DataPlayback (Class): A LineExtractionApp module class.
    *   Controls the playback of data
    ****************************************************************************************/
    let DataPlayback = function () {
        /****************************************************************************************
        * Instance Variables
        ****************************************************************************************/
        this.data;
        this.numScans;
        this.currentIndex;

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        this.init = (recordingData) => {
            this.reset();
            if (typeof recordingData !== 'undefined') {
                this.setData(recordingData);
            }
        };

        //draw the scan at a specific index (as if it was received from the sensor)
        this.drawScan = (index) => {
            if (index >= this.numScans)
                return;
            // Fire an event to alert any subscribers that a new scan is to be drawn
            LineExtractionApp.EventDispatcher.trigger('event_CollectedCompleteScanData', this.data[index]);
        };

        this.cycle = () => {
            if (this.numScans <= 0)
                return;

            this.drawScan(this.currentIndex);

            let nextDeltaTime = this.timeUntilNextIndex(this.currentIndex);

            //check if the index will rollover
            if (nextDeltaTime < 0) {
                //reset the index to 0
                this.currentIndex = 0;
            }
            else {
                this.currentIndex++;
            }
            //call the next cycle in the appropriate amount of time
            setTimeout(() => { this.cycle(); }, nextDeltaTime);
        };

        this.timeUntilNextIndex = (theIndex) => {
            //example
            let nextIndex = (theIndex >= (this.numScans - 1)) ? 0 : theIndex + 1;
            let timeStamp_Index = this.data[theIndex].timeStamp;
            let timeStamp_nextIndex = this.data[nextIndex].timeStamp;
            let deltaMillis = timeStamp_nextIndex - timeStamp_Index;
            return deltaMillis;
        };

        this.setData = (newData) => {
            this.data = newData;
            this.numScans = this.data.length;
        };

        // resets the playback
        this.reset = () => {
            this.data = null;
            this.numScans = 0;
            this.currentIndex = 0;
        };
    };


    /****************************************************************************************
    * Methods
    ****************************************************************************************/
    //converts a polar coordinate to a 2D cartesian coordinate
    let polar2Cart = (theAngle_deg, theRadius) => {
        let x = theRadius * Math.cos(deg2Rad(theAngle_deg));
        let y = theRadius * Math.sin(deg2Rad(theAngle_deg));
        return new CartesianCoordStruct(x, y, 0);
    };

    //converts an anlge from degrees to radians
    let deg2Rad = (theAngle_deg) => {
        return theAngle_deg * (Math.PI / 180);
    };

    //compatability crutch in case the date.now is unsupported
    if (!Date.now) {
        Date.now = function () { return new Date().getTime(); }
    };


    //Comparators for sorting arrays of sensor readings
    let compareRadius = (a, b) => {
        if (a.polarCoord.radius < b.polarCoord.radius)
            return -1;
        if (a.polarCoord.radius > b.polarCoord.radius)
            return 1;
        return 0;
    };

    //Helper functions to help when filtering an array of sensor readings using array.filter
    let radiusCheck = (min, max) => {
        return function (element) { return element.isInRadiusRange(min, max); }
    };

    // removes sensor readings from a scan struct that are within a specified radius
    let removeSensorReadingsInsideRadius = (scan, radius) => {
        scan.sensorReadings = scan.sensorReadings.filter(radiusCheck(radius, Number.MAX_SAFE_INTEGER));
    };



    /****************************************************************************************
    Sub-Modules
    ****************************************************************************************/

    /************************************************************************************//**
    ** ScanFile (Module): A LineExtractionApp Data module. 
    *   Provides methods to interpret JSON objects into datapoints. 
    ****************************************************************************************/
    let ScanFile = function () {
        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        // interprets a json object into an array of scans according to the known scan data json format
        let interpretJSONData = (jsonObject) => {
            let numScans;
            let allScans = [];
            let bLogTimeStampPerScan = jsonObject.bLogTimeStampPerSweep;

            if (!bLogTimeStampPerScan) {
                console.error("Not handling this kind of recording yet");
                return null;
            }

            numScans = jsonObject.Sweeps.length;
            //loop through each scan
            for (let i = 0; i < numScans; i++) {
                //grab all the data for that scan
                let theTimeStamp = jsonObject.Sweeps[i].TimeStamp;
                let theAngles = jsonObject.Sweeps[i].SensorReading_Angles;
                let theRadii = jsonObject.Sweeps[i].SensorReading_Radii;
                let theSignalStrengths = jsonObject.Sweeps[i].SensorReading_SignalStrength;

                let numSensorReadings = theAngles.length;
                let allSensorReadings = [];
                //loop through each sensor reading in the scan
                for (let j = 0; j < numSensorReadings; j++) {
                    //create a sensor reading class from the limited data and then store it
                    allSensorReadings.push(new SensorReading(theAngles[j], theRadii[j], theSignalStrengths[j]));
                }
                //store all the sensor reading instances for this scan in a scan data struct
                allScans.push(new ScanDataStruct(allSensorReadings, theTimeStamp));
            }
            return allScans;
        };


        /************************************************************************************//**
        ** Public API
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            //public methods
            interpretJSONData: interpretJSONData
        };
    }();


    /************************************************************************************//**
    ** Public API
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // public sub-modules
        ScanFile: ScanFile,

        // public classes/structs
        ScanDataStruct: ScanDataStruct,
        PolarCoordStruct: PolarCoordStruct,
        CartesianCoordStruct: CartesianCoordStruct,
        SensorReading: SensorReading,
        DataPlayback: DataPlayback,

        // public methods
        polar2Cart: polar2Cart,
        deg2Rad: deg2Rad,
        compareRadius: compareRadius,
        radiusCheck: radiusCheck,
        removeSensorReadingsInsideRadius: removeSensorReadingsInsideRadius
    };

}();