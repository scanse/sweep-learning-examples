/************************************************************************************//**
** Perception (Module): 
*   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
*   perception tasks from 2D lidar scans. Currently only basic boundary extraction is  
*   implmented, using the Split-Merge line extraction algorithm.
****************************************************************************************/
LineExtractionApp.Perception = function () {
    /****************************************************************************************
    * Includes and Constants
    ****************************************************************************************/
    const _HELPERS = LineExtractionApp.Utils.GenericHelpers;
    const _POINT_2D_UTILS = LineExtractionApp.Processing.Point2DUtils;
    const _SENSOR_READING_UTILS = LineExtractionApp.Processing.SensorReadingUtils;
    const _FILTERING = LineExtractionApp.Processing.Filtering;

    /****************************************************************************************
    Sub-Modules
    ****************************************************************************************/

    /************************************************************************************//**
    ** PrimitiveExtraction (Module): 
    *   A LineExtractionApp module that provides a collection of classes/structs/methods to assist 
    *   in extracting primitives from 2D scan data (currently only line extraction)
    ****************************************************************************************/
    let PrimitiveExtraction = function () {
        /****************************************************************************************
        * Enums
        ****************************************************************************************/
        const LineExtractionTechniqueEnum = {
            SPLIT_MERGE: 1,

            properties: {
                1: { name: "SPLIT_MERGE", value: 1, displayName: "Iterative end point split-merge", bIsDefault: true }
            }
        };

        /****************************************************************************************
        * Defaults for various types of classes
        ****************************************************************************************/
        const PreProcessorParameterDefaults = {
            SENSOR_READINGS: {
                minRadius: 50,
                filter: _FILTERING.FilterTechniqueEnum.NO_FILTER,
                filterParams: _FILTERING.FilterParameterDefaults.NO_FILTER
            }
        };

        const PostProcessorParameterDefaults = {
            LINES: {
                minSetSize: 5
            }
        };

        const LineExtractorParameterDefaults = {
            SPLIT_MERGE: {
                distanceThreshold: 20,
                collinearityThreshold: 2000,
                bUseIntermediateLineFitting: false
            }
        };

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        // creates a line extractor of the specified type
        let createLineExtractor = (type, params) => {
            switch (type) {
                case LineExtractionTechniqueEnum.SPLIT_MERGE:
                    return typeof params === 'undefined' ? new SplitMerge() : new SplitMerge(params);
                default:
                    console.log(`The extraction method "${method}" does not exist, so defaulting to SPLIT MERGE`);
                    return new SplitMerge();
            }
        };

        /****************************************************************************************
        * Classes
        ****************************************************************************************/
        // (Class) Pre Processes data points
        let SensorReadingsPreProcessor = function (params) {
            // verify and validate the processing parameters against the default values
            this.params = _HELPERS.checkParams(params, PreProcessorParameterDefaults.SENSOR_READINGS);
            // verify and validate the filter parameters against the default values for the specified filter
            let defaultFilterParamsKey = _FILTERING.FilterTechniqueEnum.properties[this.params.filter].parameterDefaultKey;
            this.params.filterParams = _HELPERS.checkParams(this.params.filterParams, _FILTERING.FilterParameterDefaults[defaultFilterParamsKey])

            // perform processing according to the parameters
            this.process = (sensorReadings) => {
                // remove points inside the specified minimum radius
                let processed = _SENSOR_READING_UTILS.removePointsInsideRadius(sensorReadings, this.params.minRadius);
                // remove points with impossible bearings (azimuth value less than its predecessor)
                _SENSOR_READING_UTILS.removeReadingsWithImpossibleBearings(processed);
                // filter the readings if requested
                switch (this.params.filter) {
                    case _FILTERING.FilterTechniqueEnum.NO_FILTER:
                        break;
                    case _FILTERING.FilterTechniqueEnum.MEDIAN_1D:
                        processed = _FILTERING.medianFilter1D(processed, this.params.filterParams);
                        break;
                    default:
                        break;
                }
                // return the processed readings
                return processed;
            };


            this.setParams = (newParams) => {
                this.params = _HELPERS.checkParams(newParams, this.params);
            };
        };


        // (Class) Post Processes lines
        let LinePostProcessor = function (params) {
            // verify and validate the processing parameters against the default values
            this.params = _HELPERS.checkParams(params, PostProcessorParameterDefaults.LINES);

            // perform processing according to the parameters
            this.process = (lines) => {
                // remove any tiny sets (post-processing)
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].sensorReadings.length < this.params.minSetSize) {
                        lines.splice(i, 1);
                        i--;
                    }
                }
                return lines;
            };

            this.setParams = (newParams) => {
                this.params = _HELPERS.checkParams(newParams, this.params);
            };
        };

        // (Class) Extracts lines from data points
        let LineExtractor = function (extractorType, extractorParams, preProcessorParams, postProcessorParams) {

            // INSTANCE VARIABLES:
            this.extractor = null;
            if (typeof extractorType === 'undefined') {
                this.extractor = createLineExtractor(_HELPERS.getEnumDefault(LineExtractionTechniqueEnum));
            }
            else {
                this.extractor = typeof extractorParams === 'undefined' ? createLineExtractor(extractorType) : createLineExtractor(extractorType, extractorParams);
            }

            // create processors for pre/post processing (use defaults if the parameters are not specified)
            this.preProcessor = typeof preProcessorParams === 'undefined' ? new SensorReadingsPreProcessor() : new SensorReadingsPreProcessor(preProcessorParams);
            this.postProcessor = typeof postProcessorParams === 'undefined' ? new LinePostProcessor() : new LinePostProcessor(postProcessorParams);

            // METHODS:
            // Extracts lines given a ScanDataStruct
            // returns: an array of line objects  
            this.extractLines = (scan) => {
                // convert the scan to a useable structure of points
                let sensorReadings = scan.sensorReadings;

                // pre-process the points
                sensorReadings = this.preProcessor.process(sensorReadings);
                if (sensorReadings.length <= 2)
                    return [];

                // extract lines
                let lines = this.extractor.extractLines(sensorReadings);

                // post-process the lines
                lines = this.postProcessor.process(lines);

                return lines;
            };

            // SETTERS:
            this.setParams = (extractorParams, preProcessorParams, postProcessorParams) => {
                this.setExtractorParams(extractorParams);
                this.setPreProcessorParams(preProcessorParams);
                this.setPostProcessorParams(postProcessorParams);
            };
            this.setExtractorParams = (params) => {
                this.extractor.setParams(params);
            };
            this.setPreProcessorParams = (params) => {
                this.preProcessor.setParams(params);
            };
            this.setPostProcessorParams = (params) => {
                this.postProcessor.setParams(params);
            };
        };


        // (Class) Extracts lines from data points using a split-merge algorithm
        let SplitMerge = function (params) {

            // INSTANCE VARIABLES:
            // verify and validate the parameters against the default values
            this.params = _HELPERS.checkParams(typeof params === 'undefined' ? null : params, LineExtractorParameterDefaults.SPLIT_MERGE);
            this.params.distanceThresholdSquared = this.params.distanceThreshold * this.params.distanceThreshold;
            this.S;


            // METHODS:

            // extract lines from the current data points using the split-merge algorithm
            // return: an array of line objects 
            this.extractLines = (sensorReadings) => {

                //initialize the set of lines to be empty    
                this.S = [sensorReadings];

                let mostDistantPair = _SENSOR_READING_UTILS.findMostDistantPair(sensorReadings);
                if (!mostDistantPair) return;

                // Split (step)        
                //this.split( sensorReadings, mostDistantPair.startPtIndex, mostDistantPair.endPtIndex );
                this.split(sensorReadings);

                // Merge (step)
                this.merge();

                return this.S;
            };

            // recursive split step of the SplitMerge algorithm
            //this.split = ( sensorReadings, startPtIndex, endPtIndex ) => {
            this.split = (sensorReadings) => {
                let numReadings = sensorReadings.length;
                if (numReadings === undefined || numReadings < 2)
                    return;

                let lineStart, lineEnd;
                if (this.params.bUseIntermediateLineFitting) {
                    let fit = _SENSOR_READING_UTILS.linearRegression(sensorReadings);
                    let xLimits = _SENSOR_READING_UTILS.findXLimits(sensorReadings);
                    lineStart = { x: xLimits.min, y: xLimits.min * fit.gradient + fit.intercept };
                    lineEnd = { x: xLimits.max, y: xLimits.max * fit.gradient + fit.intercept };
                }
                else {
                    let mostDistantPair = _SENSOR_READING_UTILS.findMostDistantPair(sensorReadings);
                    if (!mostDistantPair)
                        return;
                    lineStart = sensorReadings[mostDistantPair.startPtIndex].cartesianCoord;
                    lineEnd = sensorReadings[mostDistantPair.endPtIndex].cartesianCoord;
                }


                // Find the most distant point to the line
                let distanceResults = _SENSOR_READING_UTILS.findMostDistantPtToLine(sensorReadings, lineStart, lineEnd);

                let setIndex = this.S.indexOf(sensorReadings);

                // if distance > threshold, split and repeat with left and right point sets
                if (distanceResults.distSqrd > this.params.distanceThresholdSquared) {
                    if (numReadings <= 2)
                        return;

                    // split
                    let S1, S2;
                    switch (distanceResults.index) {
                        case 0:
                            S1 = sensorReadings.slice(0, 1);
                            S2 = sensorReadings.slice(1);
                            break;
                        case (numReadings - 1):
                            S1 = sensorReadings.slice(0, distanceResults.index);
                            S2 = sensorReadings.slice(distanceResults.index - 1);
                            break;
                        default:
                            S1 = sensorReadings.slice(0, distanceResults.index + 1);
                            S2 = sensorReadings.slice(distanceResults.index);
                            break;
                    }

                    // replace the set in S with the two new sets
                    this.S.splice(setIndex, 1, S1, S2);

                    // recursively repeat with left and right point sets
                    this.split(S1);
                    this.split(S2);
                }
                else {
                    let newSet = {
                        sensorReadings: sensorReadings,
                        lineSegmentStartPt: lineStart,
                        lineSegmentEndPt: lineEnd
                    };
                    let setIndex = this.S.indexOf(sensorReadings);
                    this.S.splice(setIndex, 1, newSet);
                }
                return;
            };

            // check if two segments are collinear and should be merged
            this.checkIfShouldMerge = (S1, S2) => {
                let collinearityMetric, mergedSensorReadings, fit, segStart, segEnd, distanceResults;

                // measure the two line's collinearity
                collinearityMetric = _POINT_2D_UTILS.collinearityTest(
                    S1.lineSegmentStartPt,
                    S1.lineSegmentEndPt,
                    S2.lineSegmentStartPt,
                    S2.lineSegmentEndPt);

                // if two consecutive segments are close/collinear enough
                if (collinearityMetric <= this.params.collinearityThreshold) {
                    // temporarily merge the sets
                    mergedSensorReadings = S1.sensorReadings.concat(S2.sensorReadings);
                    // obtain the common line between the sets
                    fit = _SENSOR_READING_UTILS.linearRegression(mergedSensorReadings);
                    let xLimits = _SENSOR_READING_UTILS.findXLimits(mergedSensorReadings);
                    segStart = { x: xLimits.min, y: xLimits.min * fit.gradient + fit.intercept };
                    segEnd = { x: xLimits.max, y: xLimits.max * fit.gradient + fit.intercept };

                    // Find the most distant point to the line
                    distanceResults = _SENSOR_READING_UTILS.findMostDistantPtToLine(mergedSensorReadings, segStart, segEnd);

                    //merge the segments if they're close
                    if (distanceResults.distSqrd <= this.params.distanceThresholdSquared) {
                        return {
                            bShouldMerge: true,
                            mergedObject: {
                                sensorReadings: mergedSensorReadings,
                                lineEquation: fit,
                                lineSegmentStartPt: segStart,
                                lineSegmentEndPt: segEnd
                            }
                        };
                    }
                }
                return { bShouldMerge: false };
            };

            // merge step of the SplitMerge algorithm
            this.merge = () => {
                // remove any sets without a line
                for (let i = this.S.length - 1; i >= 0; i--) {
                    if (!this.S[i].hasOwnProperty("sensorReadings"))
                        this.S.splice(i, 1);
                }

                let S1, S2;
                let i = 0;
                while (i < this.S.length - 1) {
                    // take two consecutive segments
                    S1 = this.S[i];
                    S2 = this.S[i + 1];

                    let mergeCheck = this.checkIfShouldMerge(S1, S2);
                    if (mergeCheck.bShouldMerge) {
                        //replace the first set with the merged set
                        this.S[i] = mergeCheck.mergedObject;
                        //remove the second set
                        this.S.splice(i + 1, 1);
                    }
                    else {
                        i++;
                    }
                }

                // check for collinearity of the two rollover consecutive segments (to either side of the 0/360 angle)
                if (this.S.length >= 2) {
                    // take first and last segments
                    S1 = this.S[0];
                    S2 = this.S[this.S.length - 1];

                    let mergeCheck = this.checkIfShouldMerge(S1, S2);
                    if (mergeCheck.bShouldMerge) {
                        //replace the first set with the merged set
                        this.S[0] = mergeCheck.mergedObject;
                        //remove the second set
                        this.S.splice(this.S.length - 1, 1);
                    }
                }
            };

            // SETTERS:
            // specify any new parameters
            this.setParams = (newParams) => {
                this.params = _HELPERS.checkParams(newParams, this.params);
                this.params.distanceThresholdSquared = this.params.distanceThreshold * this.params.distanceThreshold;
            };

        };


        /************************************************************************************//**
        ** Public API --- primitive extraction sub-module
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            // public enums
            LineExtractionTechniqueEnum: LineExtractionTechniqueEnum,

            // public classes
            LineExtractor: LineExtractor,
            SensorReadingsPreProcessor: SensorReadingsPreProcessor,
            LinePostProcessor: LinePostProcessor
        };
    }();



    /************************************************************************************//**
    ** Public API --- perception module
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // public sub-modules
        PrimitiveExtraction: PrimitiveExtraction
    };
}();