/************************************************************************************//**
** Plotting (Module): A LineExtractionApp module.
*   Structures relevant ot plotting 2D graphs of sensor data.
****************************************************************************************/
LineExtractionApp.Plotting = function () {
    /****************************************************************************************
    * Includes
    ****************************************************************************************/
    const _FILTERING = LineExtractionApp.Processing.Filtering;

    /************************************************************************************//**
    ** Graph Manager (Class): A LineExtractionApp Graph module class.
    *   Manages the graphs which display data
    ****************************************************************************************/
    let GraphManager = function () {
        /****************************************************************************************
        * Instance Variables
        ****************************************************************************************/
        // holds the previous drawn scan
        this.lastScan;
        // defines configuration options for the plotly graphs
        this.plotlyConfigurationOptions
        // the id for the HTML div elements that serve as containers for the plots
        this.cartesianPlotContainerID;
        this.polarPlotContainerID;
        // the data and layout for both plots
        this.polarData;
        this.polarLayout;
        this.cartesianData;
        this.cartesianLayout;

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        // initialize the graph manager
        this.init = (cartesianPlotContainerID, polarPlotContainerID) => {
            this.lastScan = null;
            this.cartesianPlotContainerID = cartesianPlotContainerID;
            this.polarPlotContainerID = polarPlotContainerID;
            //create and initialize some settings
            this.initPlotlyConfigOptions();
            //initialize the graphs
            this.initPlotlyGraphs(cartesianPlotContainerID, polarPlotContainerID);
        };

        // init plotly config options to some default values
        this.initPlotlyConfigOptions = () => {
            this.plotlyConfigurationOptions = {
                // no interactivity, for export or image generation
                staticPlot: true,
                // new users see some hints about interactivity
                showTips: false,
                // enable axis pan/zoom drag handles
                showAxisDragHandles: false,
                // enable direct range entry at the pan/zoom drag points (drag handles must be enabled above)
                showAxisRangeEntryBoxes: false,
                // display the mode bar (true, false, or 'hover')
                displayModeBar: false,
                // add the plotly logo on the end of the mode bar
                displaylogo: false
            };
        };

        this.initPlotlyGraphs = () => {
            let tracePolar = {
                x: [],
                y: [],
                mode: 'lines+markers',
                type: 'scatter'
            };
            this.polarData = [tracePolar];
            this.polarLayout = { title: `Polar Coordinates`, xaxis: { title: 'azimuth (degrees)' }, yaxis: { title: 'range (cm)' } };
            Plotly.newPlot(this.polarPlotContainerID, this.polarData, this.polarLayout, this.plotlyConfigurationOptions);
            let traceCartesian = {
                x: [],
                y: [],
                mode: 'lines+markers',
                type: 'scatter'
            };
            this.cartesianData = [traceCartesian];
            this.cartesianLayout = { title: `2D Cartesian Coordinates`, xaxis: { title: 'x (cm)' }, yaxis: { title: 'y (cm)' } };
            Plotly.newPlot(this.cartesianPlotContainerID, this.cartesianData, this.cartesianLayout, this.plotlyConfigurationOptions);
        };

        this.clear = () => {
            this.plotSensorReadings([], false);
            this.plotSensorReadings([], true);
        };

        // Updates the graphs with data from the specified scan
        this.update = (scan) => {
            //store the scan
            this.lastScan = scan;

            // check the scan is valid
            if (!scan.sensorReadings) {
                this.clear();
                return;
            }

            let filterParams = { bPadBoundaries: false, windowSize: 3 };
            let filteredReadings = _FILTERING.medianFilter1D(scan.sensorReadings, filterParams);

            this.plotSensorReadings(filteredReadings, false /*plot polar*/);
            this.plotSensorReadings(filteredReadings, true /*plot cartesian*/);
        };

        // Refresh the graphs (used when filters are updated) with the existing data
        this.refreshGraphs = () => {
            if (this.lastScan)
                this.update(this.lastScan);
        };

        this.getPlotlyData = (sensorReadings, bCartesian) => {
            let abscissa = []; // horizontal axis -> x (cartesian) or azimuth (polar)
            let ordinate = []; // vertical axis -> y (cartesian) or radius (polar)
            for (let i = 0, len = sensorReadings.length; i < len; i++) {
                abscissa.push(bCartesian ? sensorReadings[i].cartesianCoord.x : sensorReadings[i].polarCoord.angle);
                ordinate.push(bCartesian ? sensorReadings[i].cartesianCoord.y : sensorReadings[i].polarCoord.radius);
            }
            return { abscissa: abscissa, ordinate: ordinate };
        };

        this.plotSensorReadings = (sensorReadings, bCartesian) => {
            let coords = this.getPlotlyData(sensorReadings, bCartesian);
            let trace = {
                x: coords.abscissa,
                y: coords.ordinate,
                mode: 'lines+markers',
                type: 'scatter'
            };
            if (bCartesian) {
                this.cartesianData[0] = trace;
                Plotly.redraw(this.cartesianPlotContainerID);
            }
            else {
                this.polarData[0] = trace;
                Plotly.redraw(this.polarPlotContainerID);
            }
        };
    };

    /************************************************************************************//**
    ** Public API
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // Public Classes
        GraphManager: GraphManager
    };

}();