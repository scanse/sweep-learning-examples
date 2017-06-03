/************************************************************************************//**
** Utils (Module): LineExtractionApp module.
*   Contains helpful classes and methods
****************************************************************************************/
LineExtractionApp.Utils = function () {

    /****************************************************************************************
    * Sub-Modules
    ****************************************************************************************/

    /************************************************************************************//**
    ** GenericHelpers (Module):  
    *   Provides generic helper functions useful to other modules.
    ****************************************************************************************/
    let GenericHelpers = function () {

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        //creates an array of length "len" and filled with the specified itm value
        var createPopulatedArray = function (len, itm) {
            var arr1 = [itm],
                arr2 = [];
            while (len > 0) {
                if (len & 1)
                    arr2 = arr2.concat(arr1);
                arr1 = arr1.concat(arr1);
                len >>>= 1;
            }
            return arr2;
        };

        //Returns the default value of any enum with a properties list containing a default parameter
        var getEnumDefault = function (theEnum) {
            for (let key in theEnum) {
                //don't consider the properties key
                if (key === 'properties')
                    break;
                if (theEnum.properties[theEnum[key]].bIsDefault) {
                    return theEnum[key];
                }
            }
            return null;
        };

        // compares a parameter object to its default, adding in any missed parameters using default values
        var checkParams = function (params, defaults) {
            if (!params)
                return defaults;

            let merged = {};
            // check each parameter in the defaults object
            for (let key in defaults) {
                // make sure the parameter key doesn't come from the prototype
                if (!defaults.hasOwnProperty(key))
                    continue;
                if (!params.hasOwnProperty(key)) {
                    // if the params object is missing a necessary key, 
                    // pull its default from the defaults object
                    merged[key] = defaults[key];
                }
                else {
                    // otherwise, use the one from the params object
                    merged[key] = params[key];
                }
            }
            return merged;
        };

        /************************************************************************************//**
        ** Public API
        *  Return all the methods/variables that should be public.
        ****************************************************************************************/
        return {
            // public methods
            createPopulatedArray: createPopulatedArray,
            getEnumDefault: getEnumDefault,
            checkParams: checkParams
        };
    }();

    /************************************************************************************//**
    ** Public API
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // public sub-modules
        GenericHelpers: GenericHelpers
    };
}();