# Mutation Visualization Project
This repository contains a [d3.js](https://d3js.org) project, visualizing mutation signature distributions in cancer data, inspired by Figure 3A in Huang, Xiaoqing, Damian Wojtowicz, and Teresa M. Przytycka. "Detecting Presence Of Mutational Signatures In Cancer With Confidence." bioRxiv (2017): 132597.

The data was obtained from the [SignatureEstimation](https://www.ncbi.nlm.nih.gov/CBBresearch/Przytycka/index.cgi#signatureestimation) R package, developed by Huang, et al., leveraging signature data from [COSMIC](https://cancer.sanger.ac.uk/cosmic) and tumor data from [ICGC](https://dcc.icgc.org).

The visualization can be accessed at [http://mutation-visualization.markk.co/](http://mutation-visualization.markk.co/), an instance of the project hosted on AWS.

## Setup Instructions
After cloning the repository, the app can be run using Docker:
- Navigate to the root of the project
- `docker build -t vizimage .`
- `docker run --rm --name vizcontainer -p 80:80 vizimage:latest`
- Open `localhost` in a web browser

## Project Structure
- `app` directory - contains Flask project
  - `main.py` - serves the html templates and static files
  - `icgc.py` - interacts with ICGC API to download simple somatic mutation datasets and feed them into R
  - `templates/index.html` - app front page, imports d3 dependency and visualization scripts 
  - `static/js/mut_viz.js` - creates each box plot based on signature distribution data and sets up axes
  - `static/js/box.js` - creates single box plot, adapted from the d3.js box plot example
  - `r` directory
    - `deconstruct.R` - script used to generate signature distribution csv file from the SignatureEstimation package
- `Dockerfile` - installs R, CRAN packages, and Python packages for the container
