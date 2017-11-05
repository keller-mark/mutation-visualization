# Breast Cancer Mutation Visualization Project
This repository contains a [d3.js](https://d3js.org) project, visualizing mutation signature distributions in breast cancer data, adapted from Figure 3A in Huang, Xiaoqing, Damian Wojtowicz, and Teresa M. Przytycka. "Detecting Presence Of Mutational Signatures In Cancer With Confidence." bioRxiv (2017): 132597.

The data was obtained from the [SignatureEstimation](https://www.ncbi.nlm.nih.gov/CBBresearch/Przytycka/index.cgi#signatureestimation) R package, developed by Huang, et al., leveraging signature data from [COSMIC](https://cancer.sanger.ac.uk/cosmic) and breast cancer tumor data from [ICGC](https://dcc.icgc.org).

The visualization can be accessed at [http://mutation-visualization.markk.co/](http://mutation-visualization.markk.co/), an instance of the project hosted on AWS.

## Setup Instructions
After cloning the repository, the app can be accessed locally:
- Navigate to the root of the `public` directory
- Open `index.html` in a web browser

## Project Structure
- `public` directory - contains d3.js interactive visualization
  - `index.html` - root of the project, imports d3 dependency and visualization scripts 
  - `js/mut_viz.js` - creates each box plot based on signature distribution data and sets up axes
  - `js/box.js` - creates single box plot, adapted from the d3.js box plot example
- `signature_data` directory
  - `signature_distributions.R` - script used to generate signature distribution csv file from the SignatureEstimation package
