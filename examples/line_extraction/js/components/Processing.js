/************************************************************************************//**
** Processing (Module): 
*   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
*   in processing 2D lidar data.
****************************************************************************************/
LineExtractionApp.Processing = function () {
    /****************************************************************************************
    * Includes
    ****************************************************************************************/
    const _HELPERS = LineExtractionApp.Utils.GenericHelpers;
    const _DATA = LineExtractionApp.Data;

    /****************************************************************************************
    Sub-Modules
    ****************************************************************************************/

    /************************************************************************************//**
    ** Point2DUtils (Module): 
    *   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
    *   in operations with basic 2D point objects (objects with x and y fields)
    ****************************************************************************************/
    let Point2DUtils = function () {
        /****************************************************************************************
        * Methods
        ****************************************************************************************/

        let sqr = (x) => { return x * x };
        let dist2 = (v, w) => { return sqr(v.x - w.x) + sqr(v.y - w.y) };

        // returns the squared distance from a point (p) to the line segment defined by end pts (v, w)
        let distToSegmentSquared = (p, v, w) => {
            let l2 = dist2(v, w);
            if (l2 == 0) return dist2(p, v);
            let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            return dist2(p, {
                x: v.x + t * (w.x - v.x),
                y: v.y + t * (w.y - v.y)
            });
        };

        // returns a rough metric for the collinearity of 2 segments defined by end pts (A->B, C->D) 
        let collinearityTest = (A, B, C, D) => {
            let temp1 = (Math.abs((A.x - B.x) * (C.y - D.y) - (C.x - D.x) * (A.y - B.y)));
            let temp2 = (Math.abs((A.x - C.x) * (B.y - D.y) - (B.x - D.x) * (A.y - C.y)));
            let temp3 = (Math.abs((A.x - D.x) * (C.y - B.y) - (C.x - B.x) * (A.y - D.y)));
            return (temp1 + temp2 + temp3) / 3;
        };

        // returns the square of the distance between two points
        let squaredDistBetweenPts = (A, B) => {
            return (B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y);
        }

        /************************************************************************************//**
        ** Public API --- points sub-module
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            // public methods
            distToSegmentSquared: distToSegmentSquared,
            collinearityTest: collinearityTest,
            squaredDistBetweenPts: squaredDistBetweenPts,
        };

    }();

    /************************************************************************************//**
    ** SensorReadingUtils (Module): 
    *   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
    *   in operations with basic SensorReading objects.
    ****************************************************************************************/
    let SensorReadingUtils = function () {
        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        // remove readings from an array of readings based on the radius
        let removePointsInsideRadius = (readings, radius) => {
            return readings.filter(_DATA.radiusCheck(radius, Number.MAX_SAFE_INTEGER));
        };

        // removes error readings whose bearings are less than the previous
        // return: none, performed in place on array 
        let removeReadingsWithImpossibleBearings = (readings) => {
            let bearing;
            let lastBearing = -1;
            for (let i = 0, len = readings.length; i < len; i++) {
                bearing = readings[i].polarCoord.angle;

                if (bearing <= lastBearing) {
                    //let nextBearing = (typeof readings[i+1] === 'undefined') ? `no more bearing this scan`: readings[i+1].polarCoord.angle;
                    //console.log(`Error at index ${i}: bearing window [${lastBearing}, ${bearing}, ${nextBearing}]`);
                    readings.splice(i, 1);
                    len--;
                }
                else {
                    lastBearing = bearing;
                }
            }
        };

        // returns the median radius from an array of sensor readings
        let findMedianRadius = (sensorReadings, middleIndex) => {
            sensorReadings.sort(_DATA.compareRadius);
            return sensorReadings[middleIndex].polarCoord.radius;
        };

        // returns the indices and distance between the two most distant points in the array of sensorReadings
        let findMostDistantPair = (sensorReadings) => {
            let result = {
                startPtIndex: null,
                endPtIndex: null,
                squaredDistance: -1
            }
            let tempDistSqrd;

            // for each pair of segments in L 
            for (let i = 0, len = sensorReadings.length; i < len; i++) {
                for (let j = i + 1; j < len; j++) {
                    let tempDistSqrd = Point2DUtils.squaredDistBetweenPts(sensorReadings[i].cartesianCoord, sensorReadings[j].cartesianCoord);
                    if (tempDistSqrd > result.squaredDistance) {
                        result.startPtIndex = i;
                        result.endPtIndex = j;
                        result.squaredDistance = tempDistSqrd;
                    }
                }
            }
            return (result.squaredDistance >= 0) ? result : null;
        };

        // returns the index and distance of the most distant reading to a line segmenet defined by end pts
        let findMostDistantPtToLine = (sensorReadings, lineSegStart, lineSegEnd) => {
            // Find the most distant point to the line
            let biggestSoFar = 0;
            let indexOfBiggestSoFar = -1;
            let tempDist;
            for (let i = 0, len = sensorReadings.length; i < len; i++) {
                tempDist = Point2DUtils.distToSegmentSquared(sensorReadings[i].cartesianCoord, lineSegStart, lineSegEnd);
                if (tempDist > biggestSoFar) {
                    biggestSoFar = tempDist;
                    indexOfBiggestSoFar = i;
                }
            }

            return {
                index: indexOfBiggestSoFar,
                distSqrd: biggestSoFar
            }
        };

        // returns the min and max X values in an array of sensorReadings
        let findXLimits = (sensorReadings) => {
            let limits = {
                min: Number.MAX_SAFE_INTEGER,
                max: -Number.MAX_SAFE_INTEGER
            }
            let xCoord;
            for (let i = 0, len = sensorReadings.length; i < len; i++) {
                xCoord = sensorReadings[i].cartesianCoord.x;
                if (xCoord < limits.min)
                    limits.min = xCoord;
                if (xCoord > limits.max)
                    limits.max = xCoord;
            }
            return limits;
        };

        // performs a basic linear regression 
        // returns a slope & intercept eqn of a line (y = mx+b) that best describes the sensor readings 
        let linearRegression = (data) => {
            let sum = [0, 0, 0, 0], n = 0, results = [];
            for (; n < data.length; n++) {
                if (data[n].cartesianCoord.x != null) {
                    sum[0] += data[n].cartesianCoord.x;
                    sum[1] += data[n].cartesianCoord.y;
                    sum[2] += data[n].cartesianCoord.x * data[n].cartesianCoord.x;
                    sum[3] += data[n].cartesianCoord.x * data[n].cartesianCoord.y;
                    //sum[4] += data[n].y * data[n].y;
                }
            }
            let gradient = (n * sum[3] - sum[0] * sum[1]) / (n * sum[2] - sum[0] * sum[0]);
            let intercept = (sum[1] / n) - (gradient * sum[0]) / n;
            return { gradient: gradient, intercept: intercept };
        };


        /************************************************************************************//**
        ** Public API --- sensor reading utils sub-module
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            // public methods
            removePointsInsideRadius: removePointsInsideRadius,
            removeReadingsWithImpossibleBearings: removeReadingsWithImpossibleBearings,

            findMedianRadius: findMedianRadius,

            findMostDistantPair: findMostDistantPair,
            findMostDistantPtToLine: findMostDistantPtToLine,
            linearRegression: linearRegression,
            findXLimits: findXLimits
        };
    }();

    /************************************************************************************//**
    ** Filtering (Module): 
    *   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
    *   in filtering 2D lidar data.
    ****************************************************************************************/
    let Filtering = function () {
        /****************************************************************************************
        * Enums
        ****************************************************************************************/
        const FilterTechniqueEnum = {
            NO_FILTER: 0,
            MEDIAN_1D: 1,

            properties: {
                0: { name: "NO_FILTER", value: 0, parameterDefaultKey: 'NO_FILTER', displayName: "No Filter", bIsDefault: true },
                1: { name: "MEDIAN_1D", value: 1, parameterDefaultKey: 'MEDIAN_1D', displayName: "Median 1D", bIsDefault: false }
            }
        };

        /****************************************************************************************
        * Defaults for various types of classes
        ****************************************************************************************/
        const FilterParameterDefaults = {
            NO_FILTER: {

            },
            MEDIAN_1D: {
                bPadBoundaries: false, // True-> assume discontiguous readings, False-> assume contiguous readings
                windowSize: 3
            }
        };

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        // verifies an odd filter size >= 3
        let _checkFilterSize = (filterSize) => {
            // if the filter is too small, make it 3
            if (filterSize < 3)
                return 3;
            // if the filter is even sized, make it odd
            if ((filterSize % 2) === 0)
                return filterSize - 1;
            return filterSize;
        };

        // performs a 1D median filter on the input sensor readings
        // returns an array of sensor readings (filtered)
        let medianFilter1D = (sensorReadings, params) => {
            let filterType = FilterTechniqueEnum.MEDIAN_1D;
            let defaultParams = FilterParameterDefaults[FilterTechniqueEnum.properties[filterType].parameterDefaultKey];
            params = (typeof params === 'undefined' || !params) ? defaultParams : _HELPERS.checkParams(params, defaultParams);

            // example: 
            //      len=9
            //      k=5 (sliding window is 5 elements wide)
            //      offset=2 (a sliding window of size 5 has 2 spaces to either side of its center)
            //      firstOverlapIndex=2
            //      lastOverlapIndex=6
            let len = sensorReadings.length;
            // Guarantee that the size of the sliding window is odd and >=3
            let k = _checkFilterSize(params.windowSize);
            // The number of spaces to either side of the center of the sliding window
            let offset = Math.floor(k / 2);
            // The first index where the sliding window is completely overlapping the sensorReadings array
            let firstOverlapIndex = offset;
            // The last index where the sliding window is completely overlapping the sensorReadings array
            let lastOverlapIndex = len - offset - 1;

            if (len < k)
                return sensorReadings;


            let filteredReadings = [];
            let window;

            // handle array indices where the left side of the sliding window is not yet overlapping the array
            for (let i = 0; i < firstOverlapIndex; i++) {
                window = [];

                // fill the portion of window that is NOT overlapping
                for (let j = i - offset; j < 0; j++) {
                    window.push(params.bPadBoundaries ?
                        sensorReadings[0] :     // pad the missing elements with the value at index 0
                        sensorReadings[len + j] // or assume array is contiguous/circular and pull values from the high indices
                    );
                }
                // fill the portion of the window that IS overlapping the sensor readings array
                for (let j = 0; j <= i + offset; j++)
                    window.push(sensorReadings[j]);

                let newSensorReading = new _DATA.SensorReading(
                    sensorReadings[i].polarCoord.angle,
                    SensorReadingUtils.findMedianRadius(window, offset),
                    sensorReadings[i].signalStrength);

                filteredReadings.push(newSensorReading);
            }
            // handle the array indices where the entire sliding window is overlapping the array
            for (let i = offset; i <= lastOverlapIndex; i++) {
                window = [];
                for (let j = i - offset; j <= i + offset; j++)
                    window.push(sensorReadings[j]);

                let newSensorReading = new _DATA.SensorReading(
                    sensorReadings[i].polarCoord.angle,
                    SensorReadingUtils.findMedianRadius(window, offset),
                    sensorReadings[i].signalStrength);

                filteredReadings.push(newSensorReading);
            }
            // handle array indices where the right side of the sliding window is not overlapping the array
            for (let i = lastOverlapIndex + 1; i < len; i++) {
                window = [];
                // fill the portion of the window that IS overlapping the sensor readings array
                for (let j = i - offset; j < len; j++)
                    window.push(sensorReadings[j]);
                //fill the portion of window that is NOT overlapping
                for (let j = len; j <= i + offset; j++) {
                    window.push(params.bPadBoundaries ?
                        sensorReadings[len - 1] :   // pad the missing elements with the value at index (len-1)
                        sensorReadings[j - len]     // or assume array is contiguous/circular and pull values from the early indices
                    );
                }

                let newSensorReading = new _DATA.SensorReading(
                    sensorReadings[i].polarCoord.angle,
                    SensorReadingUtils.findMedianRadius(window, offset),
                    sensorReadings[i].signalStrength);

                filteredReadings.push(newSensorReading);
            }
            return filteredReadings;
        };

        /************************************************************************************//**
        ** Public API --- filtering sub-module
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            // Public enums
            FilterTechniqueEnum: FilterTechniqueEnum,
            FilterParameterDefaults: FilterParameterDefaults,

            // Public methods
            medianFilter1D: medianFilter1D,
        };
    }();


    /************************************************************************************//**
    ** Public API --- processing module
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // Public sub-modules
        Point2DUtils: Point2DUtils,
        SensorReadingUtils: SensorReadingUtils,
        Filtering: Filtering
    };
}();