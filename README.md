# easy-csl-styles
## Use case
This simple web app allows you to create CSL files from a natural language like input. This is - in our opinion - easier than writing styles from scratch / modifiying existing styles. We also hope that it's easier to use than the [Visual CSL Editor](https://editor.citationstyles.org/visualEditor/). 

## Download and Install
Dowload the `CSL Style Editor.zip` file from the [releases page](https://github.com/theRatramnus/easy-csl-styles/releases), unpack it and open the `start.html` file.

## Limitations
Right now, the app is only available in German and for a limited number of item types. It supports:
- books
- journal articles
- chapters
- encyclopedia entries

## Issues
If you run into any issues, please do open a Github issue, thanks :)

## Contribute
In case the current features are not enough for your needs, please open an issue, feedback is always welcome :)
If you are proficient in a different language and would like to contribute a translation, that would be great!
In that case, open an issue, fork the repository and translate the `site.html` file and the terms in the `cslDictionary` in `src/index.js` and I'll try to integrate them.

## Thanks
The visual editor was a huge help in the development of this web-app and in understanding how CSL works in general.
This project uses the [xml-js](https://www.npmjs.com/package/xml-js) package to validate the CSL file and format it correctly. 
It also uses [webpack](https://webpack.js.org) to simplify deployment.
These packages made my life a lot easier!
