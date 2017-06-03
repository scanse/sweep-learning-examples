/****************************************************************************************
* Module Includes
****************************************************************************************/
const _EVENTS = LineExtractionApp.EventDispatcher;
const _DATA = LineExtractionApp.Data;
const _PLOTTING = LineExtractionApp.Plotting;
const _GRAPHICS = LineExtractionApp.Graphics;

/****************************************************************************************
* Global Variables
****************************************************************************************/
let graphManager = new _PLOTTING.GraphManager();
let visualizer = new _GRAPHICS.Visualizer();
let dataPlayback = new _DATA.DataPlayback();

/****************************************************************************************
* Methods
****************************************************************************************/
// Once the document is ready, initialize various components of the application
$(document).ready(function () {
    // init components
    initializeGraphManager();
    initializeVisualizer();
    initCustomEventSubscriptions();

    // begin playback
    playbackData();
});

function initializeGraphManager() {
    graphManager.init('div_Cartesian_Plot_Container', 'div_Polar_Plot_Container');
}

function initializeVisualizer() {
    visualizer.init('div_Visualizer_Container');
    visualizer.animate();
}

function playbackData() {
    let jsonObject = JSON.parse(EXAMPLE_RECORDING_1_JSON_DATA);
    let recordingData = _DATA.ScanFile.interpretJSONData(jsonObject);
    dataPlayback.init(recordingData);
    dataPlayback.cycle();
}

function initCustomEventSubscriptions() {
    // Draw a scan whenever the event fires
    _EVENTS.subscribe('event_CollectedCompleteScanData', function (scanData) {
        visualizer.drawSingleScan(scanData);
        graphManager.update(scanData);
    });
}

