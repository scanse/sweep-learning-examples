// create the root namespace and making sure we're not overwriting it
var LineExtractionApp = {};

/************************************************************************************//**
** General purpose namespace method.
** This will allow us to create namespace a bit easier.
****************************************************************************************/
LineExtractionApp.createNameSpace = function (namespace) {
    let nsparts = namespace.split(".");
    let parent = LineExtractionApp;

    // we want to be able to include or exclude the root namespace 
    // So we strip it if it's in the namespace
    if (nsparts[0] === "LineExtractionApp") {
        nsparts = nsparts.slice(1);
    }

    // loop through the parts and create 
    // a nested namespace if necessary
    for (let i = 0; i < nsparts.length; i++) {
        let partname = nsparts[i];
        // check if the current parent already has 
        // the namespace declared, if not create it
        if (typeof parent[partname] === "undefined") {
            parent[partname] = {};
        }
        // get a reference to the deepest element 
        // in the hierarchy so far
        parent = parent[partname];
    }
    // the parent is now completely constructed 
    // with empty namespaces and can be used.
    return parent;
};


/************************************************************************************//**
** Create various namespaces for the app
****************************************************************************************/
LineExtractionApp.createNameSpace("LineExtractionApp.EventDispatcher");
LineExtractionApp.createNameSpace("LineExtractionApp.Utils");
LineExtractionApp.createNameSpace("LineExtractionApp.Data");
LineExtractionApp.createNameSpace("LineExtractionApp.Processing");
LineExtractionApp.createNameSpace("LineExtractionApp.Perception");
LineExtractionApp.createNameSpace("LineExtractionApp.Plotter");
LineExtractionApp.createNameSpace("LineExtractionApp.Graphics");