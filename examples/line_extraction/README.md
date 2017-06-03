# Line Extraction Learning Example

## See the [Wiki](https://github.com/scanse/sweep-learning-examples/wiki) for Documentation

## Quickstart:

1. Retrieve the source code
```
git clone https://github.com/scanse/sweep-learning-examples
```
2. Open open `index.html` (`sweep-learning-examples/examples/line_extraction/index.html`) in a WebGL compatible browser such as google chrome.

## Compatibility:
The example is designed to run in a web browser without requiring a server or any kind of modifications to file access. However, your web browser must be able to run WebGL. You can check that here: [https://get.webgl.org/](https://get.webgl.org/)


## File Structure:
- `data/`: contains the recorded scan data used to visualize the algorithms (json data stored as string in js file).
- `js`: the source code for the application
  - `components/`: the applications components/modules
  - `namespace.js`: defines the application namespace + structure of components/modules
  - `main.js`: control logic and entry point for the application
- `lib`: third party libraries
- `style`: css helpers
- `index.html`: the HTML page

## Experimenting with Parameters
The easiest way to explore the effects of various parameters is to tinker with them and visualize the effects. To alter the parameters used in the example, simply adjust the values specified in the `initLineExtractor()` method from the `LineExtractionApp.Visualizer` module. For descriptions of each parameter, see the section on [Line Extraction](https://github.com/scanse/sweep-learning-examples/wiki/Line-Extraction).