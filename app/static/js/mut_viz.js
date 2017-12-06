var boxPlotMargin = {top: 20, right: 10, bottom: 20, left: 10},
    boxPlotWidth = 40 - boxPlotMargin.left - boxPlotMargin.right,
    boxPlotHeight = 400 - boxPlotMargin.top - boxPlotMargin.bottom;

var yAxisWidth = 100;

var chart = d3.box()
  .whiskers(iqr(1.5))
  .width(boxPlotWidth)
  .height(boxPlotHeight)
  .domain([0,1]);

// Initialize state object
var vizState = {
  "data": [],
  "masterData": [],
  "exposureThreshold": 0.00,
  "jitterPlots": false,
  "jitterRands": [],
  "boxContainerWidth": 1260
};

window.addEventListener("resize", redrawVisualization);

var jitterCheckbox = document.getElementById('switch');
jitterCheckbox.addEventListener('change', function() {
    if(this.checked) {
      addJitterPlots();
    } else {
      removeJitterPlots();
    }
});

window.onload = loadNewCSV(false);

// Read the signature distribution data into the data array, then create box plots
function loadNewCSV(new_dataset) {
  var filename = "signature_distributions_t.csv";
  if(!new_dataset) {
    filename = "brca_" + filename;
  } else {
    removeBoxPlotsAndAxes();
  }

  d3.csv("data/" + filename, function(error, csv) {
    vizState["masterData"] = [];

    if (error) throw error;

    csv.forEach(function(row) {
      var specimens = []
      for(var key in row) {
        var sigContribution = +row[key];

        if(!isNaN(sigContribution)) {
          specimens.push(sigContribution);
        }
      }
      vizState["masterData"].push(specimens);
    });

    vizState["data"] = vizState["masterData"];

    createBoxPlots();
  });
}

// Returns a function to compute the interquartile range.
function iqr(k) {
  return function(d, i) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * k,
        i = -1,
        j = d.length;
    while (d[++i] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [i, j];
  };
}
// Draw Y Axis
function boxPlotAxisY() {
  // Create y-axis container
  var yAxisContainer = d3.select("#visualization").append("svg")
    .attr("class", "y-axis")
    .attr("width", yAxisWidth)
    .attr("height", boxPlotHeight + boxPlotMargin.top + boxPlotMargin.bottom)
    .style("display", "inline")
    .style("float", "left");

  // Create y-axis scale (based on plot size)
  var yAxisScale = d3.scale.linear()
    .domain([0, 1])
    .range([boxPlotHeight, 0]);

  // Create y-axis
  var yAxis = d3.svg.axis()
    .scale(yAxisScale)
    .ticks(5)
    .orient("left");

  // Call yAxis, append as SVG, rotate labels to be vertical
  yAxisContainer.append("g")
    .call(yAxis)
    .selectAll("text")
      .attr("y", boxPlotMargin.top)
      .attr("x", yAxisWidth - 10)
      .attr("dx", "0em")
      .attr("dy", "0em")
      .attr("transform", "rotate(0)" )
      .style("text-anchor", "end");

  yAxisContainer.append("text")
    .attr("text-anchor", "end")
    .attr("x", -40)
    .attr("y", 50)
    .attr("dy", "0.25em")
    .attr("transform", "rotate(-90)")
    .text("Distribution of signature contribution");

  // Remove axis line
  d3.select(".y-axis path").remove();
}

// Draw X Axis
function boxPlotAxisX() {
  // Create x-axis container
  var xAxisContainer = d3.select("#visualization").append("svg")
    .attr("class", "x-axis")
    .style("margin-left", yAxisWidth)
    .attr("width", ((boxPlotMargin.left + boxPlotWidth + boxPlotMargin.right) * 30))
    .attr("height", 80);

  // Create x-axis scale (based on plot size)
  var xAxisScale = d3.scale.linear()
    .domain([1, 30])
    .range([0, ((boxPlotMargin.left + boxPlotWidth + boxPlotMargin.right - 1.3) * 30)]);

  // Create x-axis
  var xAxis = d3.svg.axis()
    .scale(xAxisScale)
    .ticks(30)
    .tickFormat(function(d) { return "Sig " + (d); })
    .orient("bottom");

  // Call xAxis, append as SVG, rotate labels to be vertical
  var xAxisGroup = xAxisContainer.append("g")
    .call(xAxis)
    .selectAll("text")
      .attr("y", 0)
      .attr("x", 22)
      .attr("dx", "-1.4em")
      .attr("dy", "1.5em")
      .attr("transform", "rotate(-90)" )
      .style("text-anchor", "end");

  // Append +- button to toggle box plots shown below each tick text element
  xAxisContainer.selectAll(".tick").each(function(d, i) {
    // Create button group, with hover and click events
    var sigToggleContainer = d3.select(this).append("g")
      .attr("class", "sig-toggle")
      .on("mouseover", function() {
        sigToggleContainer.select("circle").attr("fill", "#888");
        sigToggleContainer.select("text").attr("fill", "#fff");
      })
      .on("mouseleave", function() {
        sigToggleContainer.select("circle").attr("fill", "#ddd");
        sigToggleContainer.select("text").attr("fill", "#000");
      })
      .on("click", function() {
        // Toggle box plot visibility
        var boxPlot = d3.select("#visualization").select("svg.box:nth-child(" + (i + 1) + ")");
        if(isBoxPlotHidden(i)) {
          boxPlot.attr("display", "normal");
          sigToggleContainer.select("text").text("-");
        } else {
          boxPlot.attr("display", "none");
          sigToggleContainer.select("text").text("+");

          subtractSignature(i);
        }
      });

    // Create button background
    sigToggleContainer.append("circle")
      .attr("r", 10)
      .attr("cx", 18)
      .attr("cy", 64)
      .attr("fill", "#ddd");
    // Add button text
    sigToggleContainer.append("text")
          .text("-")
          .attr("font-size", "20px")
          .attr("fill", "#000")
          .attr("x", 18)
          .attr("y", 70)
          .attr("text-anchor", "middle");
  });

  // Remove axis line
  d3.select(".x-axis path").remove();

}

function isBoxPlotHidden(i) {
  return (vizState["data"][i].length == 0);
}

function subtractSignature(targetSigIndex) {
  var data = vizState["data"];
  var masterData = vizState["masterData"]
  var targetedSig = masterData[targetSigIndex];
  var numSigs = masterData.length;
  for(var sigIndex = 0; sigIndex < data.length; sigIndex++) {
    currSig = data[sigIndex];
    if(sigIndex != targetSigIndex) {
      for(var specimenIndex = 0; specimenIndex < data[sigIndex].length; specimenIndex++) {
        data[sigIndex][specimenIndex] += targetedSig[specimenIndex] / numSigs;
      }
    } else {
      data[sigIndex] = [];
    }
  }
  vizState["data"] = data;
  redrawVisualization();
}

// Remove all "points of interest" tooltips (from entire chart)
function removePlotTooltips() {
  var boxContainer = d3.select("#visualization").select("#box-container");
  boxContainer.selectAll(".box-text").remove();
}

// Show "points of interest" toolips on mouseover of box plot (min, max, quartiles)
function showPlotTooltips(d, index) {
  // Remove existing tooltips
  removePlotTooltips();

  var boxContainer = d3.select("#visualization").select("#box-container");
  var thisBox = d3.box(d);
  // Sort d to line up the proper indices with the values calculated in box.js
  var d = d.map(Number).sort(d3.ascending);

  var pointsOfInterest = (thisBox.quartiles())(d);
  var whiskerIndices = (thisBox.whiskers())(d);
  pointsOfInterest.unshift(d[whiskerIndices[0]]);
  pointsOfInterest.push(d[whiskerIndices[1]]);

  var fontSize = 12;
  var rectHeight = (fontSize+6);

  /* Append to the boxContainer so that the tooltip x-value
   * can be located outside of the current box plot container */
  var textContainer = boxContainer.append("svg").attr("class", "box-text");
  // For each "point of interest" value, add a tooltip at the proper height
  for(var poiIndex = 0; poiIndex < pointsOfInterest.length; poiIndex++) {
    var currentPoi = pointsOfInterest[poiIndex];

    var rectX = ((index+1) * (boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right));
    var rectY =  -(rectHeight)/2 + boxPlotMargin.top + boxPlotHeight - ((boxPlotHeight) * currentPoi);

    textContainer.append("rect")
      .attr("fill", "#555")
      .attr("width", (fontSize*3))
      .attr("height", rectHeight)
      .attr("x", rectX)
      .attr("y", rectY);

    textContainer.append("polygon")
      .attr("fill", "#555")
      .attr("points", "" + (rectX - (rectHeight/2) + 1) + "," + (rectY + (rectHeight)/2) + " " + rectX + "," + rectY + " " + rectX + "," + (rectY+rectHeight));

    textContainer.append("text")
      .text(currentPoi.toFixed(2))
      .attr("font-size", "" + fontSize + "px")
      .attr("fill", "#fff")
      .attr("x", 4 + rectX)
      .attr("y", rectY + fontSize+1);
  }
}

// Redraw only the box plots, not the axes
function redrawBoxPlots() {
  removeBoxPlots();

  var data = vizState["data"];
  var exposureThreshold = vizState["exposureThreshold"];

  var boxContainer = d3.select("#visualization").select("#box-container");

  // Filter data based on threshold, then call chart to create each plot
  boxContainer.selectAll("svg")
      .data(data.map(function(sigData) {
        return sigData.filter(function(sigDataPoint) {
          return sigDataPoint >= exposureThreshold;
        });
      }))
    .enter().append("svg")
      .attr("class", "box")
      .attr("width", boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)
      .attr("height", boxPlotHeight + boxPlotMargin.bottom + boxPlotMargin.top)
      .attr("x", function(d, i) { return ((boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right) * i)})
      .attr("y", 0)
    .append("g")
      .attr("transform", "translate(" + boxPlotMargin.left + "," + boxPlotMargin.top + ")")
      .call(chart) // Create each plot using d3.box
      .on('mouseover', showPlotTooltips);

  // Set mouseleave for visualization to clear all tooltips
  d3.select("#visualization")
    .on("mouseleave", function() {
      // Remove existing tooltips
      d3.select(this).selectAll(".box-text").remove();
    });

  // Check the jitterPlot state, redraw them if necessary
  if(vizState["jitterPlots"]) {
    addJitterPlots();
  }
}
// Remove everything
function removeBoxPlotsAndAxes() {
  removeBoxPlots();
  d3.select("#visualization").select(".x-axis").remove();
  d3.select("#visualization").select(".y-axis").remove();
  d3.select("#visualization").select("svg").remove();
}
// Create everything
function createBoxPlots() {

  var data = vizState["data"];

  boxPlotAxisY();

  var vizDiv = document.getElementById("visualization");
  var vizWidth = vizDiv.clientWidth - yAxisWidth;

  boxPlotWidth = (vizWidth - (31* (boxPlotMargin.left + boxPlotMargin.right))) / 31;

  chart = d3.box()
    .whiskers(iqr(1.5))
    .width(boxPlotWidth)
    .height(boxPlotHeight)
    .domain([0,1]);

  // Initialize array of random x values for jitter points
  vizState["jitterRands"] = Array.apply(null, {length: data[0].length}).map(Function.call, function() {
    return Math.random()*((boxPlotWidth + boxPlotMargin.left)/2) + ((boxPlotWidth + boxPlotMargin.left)/4) + (boxPlotMargin.left/2);
  });

  var boxContainer = d3.select(vizDiv)
    .append("svg")
      .attr("height", boxPlotHeight + boxPlotMargin.top + boxPlotMargin.bottom)
      .attr("width", vizWidth - (yAxisWidth/2))
    .append("g").attr("id", "box-container");

    redrawBoxPlots();

  boxPlotAxisX();

  //signatureClustering(vizWidth);

}
// Remove and recreate everything
function redrawVisualization() {
  removeBoxPlotsAndAxes();
  createBoxPlots();
}
// Remove only the box plots
function removeBoxPlots() {
  d3.select("#visualization").selectAll("svg.box").remove();
}

// Add jitter plot points
function addJitterPlots() {
  var data = vizState["data"];
  var jitterRands = vizState["jitterRands"];
  var exposureThreshold = vizState["exposureThreshold"];
  var scatterYScale = d3.scale.linear().range([boxPlotHeight, 0]),
    scatterYMap = function(d) { return scatterYScale(d) + boxPlotMargin.top;};

  d3.select("#visualization").selectAll(".outlier").attr("display", "none");

  // Iterate over each of the box plots
  d3.select("#visualization").selectAll("svg.box").each(function(d, i) {
    // Append each patient data point as a circle
    var g = d3.select(this);
    g.selectAll(".jitter-dot")
      .data(data[i])
    .enter().append("circle")
      .attr("class", "jitter-dot")
      .attr("r", 3.5)
      .attr("cx", function(d, jitterDotIndex) { return jitterRands[jitterDotIndex]; })
      .attr("cy", scatterYMap)
      .style("stroke-width", 0)
      .style("fill", "#000")
      .style("opacity", function(d) {
        if(d < exposureThreshold) {
          return 0;
        }
        return 0.2;
      })
      .on("mouseover", function(d, jitterDotIndex) {
        if(d < exposureThreshold) {
          return;
        }
        removePlotTooltips();
        removePatientJitterDots();

        var boxes = d3.select("#visualization").selectAll("svg.box");
        for(var boxIndex = 0; boxIndex < boxes[0].length; boxIndex++) {
            var currentBox = d3.select(boxes[0][boxIndex]);

            if(!isBoxPlotHidden(boxIndex)) {
              var patientJitterDotText = currentBox.append("text")
                .text(data[boxIndex][jitterDotIndex].toFixed(2))
                .attr("class", "patient-jitter-text")
                .attr("text-anchor", "middle")
                .attr("x", boxPlotMargin.left + (boxPlotWidth/2))
                .attr("y", boxPlotHeight + boxPlotMargin.top + 18)
                .attr("font-size", "12px")
                .attr("fill", "blue");

              var overlayPatientJitterDot = currentBox.append("circle")
                .attr("class", "patient-jitter-dot")
                .attr("r", 6)
                .attr("cx", jitterRands[jitterDotIndex])
                .attr("cy", scatterYMap(data[boxIndex][jitterDotIndex]))
                .style("stroke-width", 1.5)
                .style("stroke", "#fff")
                .style("fill", "blue")
                .style("opacity", "1");

              if(i == boxIndex) {
                overlayPatientJitterDot.on("mouseleave", function() {
                  removePatientJitterDots();
                });
              }
            }
        }
      });
  });

  vizState["jitterPlots"] = true;
}

// Remove currently-highlighted jitter plot points
function removePatientJitterDots() {
  d3.select("#visualization").selectAll("svg.box > .patient-jitter-text").remove();
  d3.select("#visualization").selectAll("svg.box > .patient-jitter-dot").remove();
}

// Remove all jitter plot points
function removeJitterPlots() {
  d3.select("#visualization").selectAll(".outlier").attr("display", "normal");

  d3.select("#visualization").selectAll(".box").each(function(d, i) {
    var g = d3.select(this);
    g.selectAll(".jitter-dot").remove();
  });

  vizState["jitterPlots"] = false;
}

function updateExposureThreshold() {
  var exposureThreshold = (document.getElementById("exposure-range").value / 100);
  vizState["exposureThreshold"] = exposureThreshold;

  var valueLabel = document.getElementById("exposure-range-value");
  valueLabel.innerHTML = exposureThreshold.toFixed(2);
  redrawBoxPlots();
}

function signatureClustering(vizWidth) {
  var data = vizState["data"];

  var colWidth = vizWidth / data.length;
  var rowHeight = 2;

  d3.select("#visualization-clustering").append("svg")
      .attr("class", "clustering")
      .attr("height", rowHeight*data[0].length)
      .attr("width", colWidth*data.length)
      .selectAll(".clustering")
    .data(data)
    .enter()
    .append("g")
    .append("svg")
      .attr("class", "matrix-column")
      .attr("x", function(d, i) { return colWidth*i; })
      .attr("y", 0)
      .attr("width", colWidth)
      .attr("height", function(d, i) { return rowHeight*d.length; })
    .selectAll(".matrix-column")
    .data(function(d, i) { return d; })
    .enter()
    .append("rect")
      .attr("x", 0)
      .attr("y", function(d, i) { return i*rowHeight })
      .attr("width", colWidth)
      .attr("height", rowHeight)
      .attr("fill", "blue")
      .attr("opacity", function(d) { return d })
      .on("mouseover", function(d, i, j) {
        d3.selectAll("#visualization-clustering g:nth-child(" + (j + 1) + ") > .matrix-column rect")
          .classed("matrix-column-highlight", true);
      });
}
