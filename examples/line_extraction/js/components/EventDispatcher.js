/************************************************************************************//**
** EventDispatcher (Module):
*   Provides methods for subscribing/publishing events. 
*   This allows decoupling of the app modules from the control logic.
****************************************************************************************/
LineExtractionApp.EventDispatcher = function () {

    let eventSubscriptions = {};

    let subscribe = (eventName, callback) => {
        // Get any current subscribers for eventName
        let subscribers = eventSubscriptions[eventName];

        if (typeof subscribers === 'undefined') {
            // If the event has no subscribers, initialize the subscribers array
            subscribers = eventSubscriptions[eventName] = [];
        }

        // Add the given callback function to the end of the array with
        // eventSubscriptions for this event.
        subscribers.push(callback);
    };

    let trigger = (eventName, data) => {
        // Get any current subscribers for the triggered event
        let subscribers = eventSubscriptions[eventName];

        if (typeof subscribers === 'undefined') {
            //console.log(`[EventDispatcher] trigger: no subscribers for event ${eventName}`);
            // If the event has no subscribers, return early (ie: don't fire event)
            return;
        }

        // Send the data for each subscriber of this event
        subscribers.forEach(function (subscriber) {
            subscriber(data || {});
        });

        //console.log(`[EventDispatcher] trigger: event ${eventName} dispatched to ${subscribers.length} subscribers, with data: ${data}`);
    }


    /************************************************************************************//**
    ** Public API
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // public methods
        subscribe: subscribe,
        trigger: trigger
    };

}();