/************************************************************************************//**
** Graphics (Module): A LineExtractionApp Module
*   Module for visualizing scan data graphically using webgl via THREE.js.
****************************************************************************************/
LineExtractionApp.Graphics = function () {
    /****************************************************************************************
    * Module Includes
    ****************************************************************************************/
    const _EXTRACTION = LineExtractionApp.Perception.PrimitiveExtraction;
    const _FILTERING = LineExtractionApp.Processing.Filtering;
    const _HELPERS = LineExtractionApp.Utils.GenericHelpers;

    /************************************************************************************//**
    ** PointCloudObject (Class): A LineExtractionApp Graphics module class.
    *   A point cloud object.
    ****************************************************************************************/
    let PointCloudObject = function (theNumPoints, parent, distanceScale) {

        this.distanceScale = distanceScale;
        // Base64 encoded png sprite of a small disc
        let discSprite = new Image();
        discSprite.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sHDgwCEMBJZu0AAAAdaVRYdENvbW1lbnQAAAAAAENyZWF0ZWQgd2l0aCBHSU1QZC5lBwAABM5JREFUWMO1V0tPG2cUPZ4Hxh6DazIOrjFNqJs0FIMqWFgWQkatsmvVbtggKlSVRVf5AWz4AWz4AUSKEChll19QJYSXkECuhFxsHjEhxCYm+DWGMZ5HF72DJq4bAzFXurI0M/I5997v3u9cC65vTJVn2lX/xHINQOYSBLTLEuIuCWw4Z3IGAEvf6ASmVHjNzHCXBG4A0AjACsAOwEbO0nsFQBnAGYASAIl+ZRMR7SolMEdsByD09fV5R0ZGgg8ePPjW5/N1iqLYpuu6RZblciKR2I9Go69evnwZnZ+fjwI4IS8AKBIRzeQfJWCANwKwh0KhtrGxsYehUOin1tbW+zzP23ietzY2NnIAoGmaLsuyUiqVyvl8XtrY2NiamZn589mzZxsAUgCOAeQAnFI2tI+VxIjaAeDzoaGh7xYWFuZOTk6OZVk+12uYqqq6JEnn0Wg0OT4+/geAXwGEAdwDIFJQXC1wO4DWR48e/RCPxxclSSroVzRFUbSDg4P848ePFwH8DuAhkWih83TRQWxFOXgAwvDwcOfo6OhvXV1d39tsNtuVBwTDWBwOh1UUxVsMw1hXVlbSdCgNV43uYSvrHg6H24aHh38eHBz85TrgF9FYLHA4HLzH43FvbW2d7u/vG+dANp8FpqIlbd3d3V8Fg8EfBUFw4BONZVmL3+9vHhkZCQL4AoAHgJPK8G+yzC0XDofdoVAo5PP5vkadTBAEtr+/39ff3x8gAp/RPOEqx2qjx+NpvXv3bk9DQ0NDvQgwDIOWlhZrMBj8kgi0UJdxRgYMArzL5XJ7vd57qLPZ7Xamp6fnNgBXtQxcjFuHw+Hyer3t9SYgCAITCAScAJoBNNEY/08GOFVVrfVMv7kMNDntFD1vjIAPrlRN0xjckOm6biFQ3jwNPwDMZrOnqVTqfb3Bi8Wivru7W/VCYkwPlKOjo0IikXh7EwQikYgE4Nw0CfXKDCipVCoTj8df3QABbW1tLUc6oUgkFPMkVACUNjc337148eKvw8PDbJ2jP1taWkoCyNDVXDSECmNSK4qiKNLq6urW8+fPI/UicHx8rD59+jSVy+WOAKSJhKENwFItLtoxk8mwsixzHR0dHe3t7c5PAU+n09rs7OzJkydPYqVSaQfANoDXALIk31S2smU1TWMPDg7K5XKZ7+3t9TudTut1U7+wsFCcmJiIpdPpbQBxADsAknQWymYCOukBHYCuKApisdhpMpnURFEU79y503TVyKenpzOTk5M7e3t7MQKPV0Zv1gNm+awB0MvlshqLxfLb29uyJElWURSbXC4XXyvqxcXFs6mpqeTc3Nzu3t7e3wQcA7BPZ8Cov1pNlJplmQtAG8MwHV6v95tAINA5MDBwPxAIuLu6upr8fr/VAN3c3JQjkcjZ+vp6fnl5+d2bN29SuVzuNYAEpf01CdRChUL+X1VskHACuA3Ay3Fcu9vt7nA6nZ7m5uYWQRCaNE3jVVW15PP580KhIGUymWw2m00DOAJwSP4WwPtq4LX2Ao6USxNlQyS/RcQcdLGwlNIz6vEMAaZpNzCk2Pll94LK/cDYimxERiBwG10sxjgvEZBE0UpE6vxj+0Ct5bTaXthgEhRmja8QWNkkPGsuIpfdjpkK+cZUWTC0KredVmtD/gdlSl6EG4AMvQAAAABJRU5ErkJggg=='
        let discTexture = new THREE.Texture();
        discSprite.onload = function () {
            discTexture.image = discSprite;
            discTexture.needsUpdate = true;
        };

        /****************************************************************************************
        * Methods
        ****************************************************************************************/
        this.createPointsObject = (numPoints) => {
            //creates a new points object which contains a pointcloud and 
            //associated attributes for representing a scan
            let initialPositions = new Float32Array(numPoints * 3);
            let initialAlphas = new Float32Array(numPoints);
            for (let i = 0; i < numPoints; i++) {
                initialPositions[i * 3 + 0] = 0;
                initialPositions[i * 3 + 1] = 0;
                initialPositions[i * 3 + 2] = 0;
                initialAlphas[i] = 0.0;
            };

            let points_geometry = new THREE.BufferGeometry();
            points_geometry.addAttribute('position', new THREE.Float32BufferAttribute(initialPositions, 3));
            points_geometry.addAttribute('alpha', new THREE.Float32BufferAttribute(initialAlphas, 1));
            points_geometry.dynamic = true;

            let material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(0xff0000) },
                    texture: { value: discTexture },
                    sizeAtNominalDistance: { value: 4.0 },  // in pixels
                    nominalDistance: { value: 50.0 },        // in world units
                    minSize: { value: 4.0 }                 // in pixels
                },
                vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                alphaTest: 0.9,
                transparent: true
            });

            return new THREE.Points(points_geometry, material);
        };

        this.setDataFromScan = (scan) => {
            let dataPoints = scan.sensorReadings;
            let numDataPoints = dataPoints.length;

            if (this.numPoints < numDataPoints) {
                console.log(`There are ${this.numPoints} vertices in the point cloud and ${numDataPoints} recordings in this scan. Adding more vertices to the point cloud.`);
                log.verbose(`There are ${this.numPoints} vertices in the point cloud and ${numDataPoints} recordings in this scan. Adding more vertices to the point cloud.`);
                this.changePointCloudSize(numDataPoints + Math.ceil(0.25 * numDataPoints));
            }

            //Change point positions and make them visible
            let dataPoint;
            let col;
            let attributes = this.points.geometry.attributes;
            for (let i = 0; i < numDataPoints; i++) {
                dataPoint = dataPoints[i];
                attributes.position.array[i * 3 + 0] = this.distanceScale * dataPoint.cartesianCoord.x;
                attributes.position.array[i * 3 + 1] = this.distanceScale * dataPoint.cartesianCoord.y;
                attributes.position.array[i * 3 + 2] = this.distanceScale * dataPoint.cartesianCoord.z;

                attributes.alpha.array[i] = 1.0;
            }
            this.points.geometry.computeBoundingSphere();

            //hide any unused points that were previously visible 
            for (let i = numDataPoints; i < this.numVisiblePoints; i++) {
                attributes.position.array[i * 3 + 0] = 0;
                attributes.position.array[i * 3 + 1] = 0;
                attributes.position.array[i * 3 + 2] = 0;
                attributes.alpha.array[i] = 0.0;
            }
            this.numVisiblePoints = numDataPoints;
            this.updateVertFlags();
        };

        this.changePointCloudSize = (numPoints) => {
            // changes the size (quantity of data points) of the point cloud, 
            // effectively permitting the display of numPoints sensor readings
            this.parent.remove(this.points);
            this.points = this.createPointsObject(numPoints);
            this.numPoints = numPoints;
            this.numVisiblePoints = 0;
            this.parent.add(this.points);
        };

        this.updateVertFlags = () => {
            //Flag the geometry attributes (Shader Attributes), indicating that values need an update
            let attributes = this.points.geometry.attributes;
            attributes.position.needsUpdate = true;
            attributes.alpha.needsUpdate = true;
        };

        this.getNumPoints = () => {
            return this.numPoints;
        };

        this.getNumVisiblePoints = () => {
            return this.numVisiblePoints;
        };

        this.getPoints = () => {
            return this.points;
        };

        this.clear = () => {
            let attributes = this.points.geometry.attributes;
            for (let i = 0; i < this.numPoints; i++) {
                attributes.position.array[i * 3 + 0] = 0;
                attributes.position.array[i * 3 + 1] = 0;
                attributes.position.array[i * 3 + 2] = 0;
                attributes.alpha.array[i] = 0.0;
            }
            this.numVisiblePoints = 0;
            this.updateVertFlags();
        };

        this.destroy = () => {
            this.parent.remove(this.points);
            this.parent = null;
            this.points = null;
            this.numPoints = null;
            this.numVisiblePoints = null;
        };

        /****************************************************************************************
        * Attributes
        ****************************************************************************************/
        this.parent = parent;
        this.points = this.createPointsObject(theNumPoints);
        this.numPoints = theNumPoints;
        this.numVisiblePoints = 0;
        this.parent.add(this.points);
    };

    /************************************************************************************//**
    ** Visualizer (Class): A LineExtractionApp Graphics module class.
    *   Manages the graphical visualization of scan data. 
    *   Uses WebGL via THREE.js.
    ****************************************************************************************/
    let Visualizer = function () {
        this.distanceScale = 0.1;

        this.$container;
        this.WIDTH;
        this.HEIGHT;

        this.scene;
        this.renderer;

        this.camera;
        this.pointCloud;

        this.MAT_line =
            this.extractedLines;
        this.lineExtractor;

        this.init = (containerID) => {

            //adjust the canvas size whenever the window is resized
            window.addEventListener('resize', this.onCanvasResize, false);

            // get the DOM element to attach to. 
            this.$container = $(`#${containerID}`);

            //grab the dimensions of the containing div
            this.WIDTH = this.$container.innerWidth();
            this.HEIGHT = this.$container.innerHeight();

            // create a scene
            this.scene = new THREE.Scene();

            // create a WebGL renderer
            try {
                this.renderer = new THREE.WebGLRenderer();
            }
            catch (err) {
                console.error(err);
                alert(err);
                return;
            }

            // start the renderer
            this.renderer.setSize(this.WIDTH, this.HEIGHT);
            // attach the render-supplied DOM element
            this.$container.append(this.renderer.domElement);

            // Init Camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = 100;

            // Create an ambient light
            let ambientLight = new THREE.AmbientLight(0xFFFFFF);
            this.scene.add(ambientLight);

            // Create a point cloud object to draw scans
            this.pointCloud = new PointCloudObject(500, this.scene, this.distanceScale);

            // Create a line extractor
            this.initLineExtractor();

            // Create an array to hold lines
            this.extractedLines = [];
            // Create a line material
            this.MAT_line = new THREE.LineBasicMaterial({ color: 0xffffff });
        };

        this.initLineExtractor = () => {
            // Create the actual line extractor
            this.lineExtractor = new _EXTRACTION.LineExtractor(
                // Line extraction method
                _EXTRACTION.LineExtractionTechniqueEnum.SPLIT_MERGE,
                // SPLIT-MERGE line extractor params
                {
                    distanceThreshold: 20,
                    collinearityThreshold: 2000,
                    bUseIntermediateLineFitting: false
                },
                // Sensor Reading Pre-Processor Params
                {
                    minRadius: 50,
                    filter: _FILTERING.FilterTechniqueEnum.MEDIAN_1D,
                    filterParams: _HELPERS.checkParams({}, _FILTERING.FilterParameterDefaults.MEDIAN_1D)
                },
                // Line Post-Processor Params
                {
                    minSetSize: 5
                }
            );
        };

        // extract lines from the scan data and draw it to the visualizer
        this.extractLines = (scan) => {
            // remove any existing lines
            this.removeExtractedLines();

            // extract the lines
            let lines = this.lineExtractor.extractLines(scan);

            // draw the extracted lines
            for (let i = 0, len = lines.length; i < len; i++) {
                let startPt = lines[i].lineSegmentStartPt;
                let endPt = lines[i].lineSegmentEndPt;
                this.drawExtractedLine(new THREE.Vector3(startPt.x, startPt.y, 0), new THREE.Vector3(endPt.x, endPt.y, 0));
            }
        };

        // remove extracted lines
        this.removeExtractedLines = () => {
            while (this.extractedLines.length > 0) {
                this.scene.remove(this.extractedLines.shift());
            }
        };

        // draws an extracted line
        this.drawExtractedLine = (startPt, endPt) => {
            let geometry = new THREE.BufferGeometry();
            let positions = new Float32Array(2 * 3);
            positions[0] = startPt.x * this.distanceScale;
            positions[1] = startPt.y * this.distanceScale;
            positions[2] = startPt.z * this.distanceScale;
            positions[3 + 0] = endPt.x * this.distanceScale;
            positions[3 + 1] = endPt.y * this.distanceScale;
            positions[3 + 2] = endPt.z * this.distanceScale;

            geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

            let line = new THREE.Line(geometry, this.MAT_line);
            this.extractedLines.push(line);
            this.scene.add(line);
        };

        // check that a scan contains a sensor readings array with at least 1 reading 
        this.checkScanIsValid = (scan) => {
            if (scan.sensorReadings === undefined || scan.sensorReadings.length === undefined || scan.sensorReadings.length < 1)
                return false;
            return true;
        };

        //draws a single new scan to the visualizer
        this.drawSingleScan = (scan) => {
            if (this.checkScanIsValid(scan) === false)
                return;

            // Update the data for the point cloud
            this.pointCloud.setDataFromScan(scan);

            this.extractLines(scan);
        };

        //update the canvas and camera whenever the window is resized
        this.onCanvasResize = () => {
            //retrieve the new dimensions of the canvas' parent div
            this.WIDTH = this.$container.innerWidth();
            this.HEIGHT = this.$container.innerHeight();

            //update the aspect ratio of the cameras
            if (this.camera) {
                this.camera.aspect = this.WIDTH / this.HEIGHT;
                this.camera.updateProjectionMatrix();
            }

            //update the size of the canvas to fill its parent div
            this.renderer.setSize(this.WIDTH, this.HEIGHT);
        };

        this.animate = () => {
            requestAnimationFrame(this.animate);
            this.render();
        };

        this.render = () => {
            //render the scene
            this.renderer.render(this.scene, this.camera);
        };


    };

    /************************************************************************************//**
    ** Public API
    *  Return all the methods/variables that should be public.
    ****************************************************************************************/
    return {
        // Public Classes
        Visualizer: Visualizer
    };
}();