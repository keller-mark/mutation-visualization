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
  "exposureThreshold": 0.00,
  "jitterPlots": false,
  "jitterRands": []
};

// Read the signature distribution data into the data array, then create box plots
d3.csv("data/signature_distributions_t.csv", function(error, csv) {
  var data = vizState["data"];

  if (error) throw error;

  csv.forEach(function(row) {
    var specimens = []
    for(var key in row) {
      var sigContribution = +row[key];

      if(!isNaN(sigContribution)) {
        specimens.push(sigContribution);
      }
    }
    data.push(specimens);
  });

  // Initialize array of random x values for jitter points
  vizState["jitterRands"] = Array.apply(null, {length: data[0].length}).map(Function.call, function() {
    return Math.random()*((boxPlotWidth + boxPlotMargin.left)/2) + ((boxPlotWidth + boxPlotMargin.left)/4) + (boxPlotMargin.left/2);
  });

  createBoxPlots();
});

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
    .attr("x", -3*boxPlotWidth)
    .attr("y", 50)
    .attr("dy", "0.25em")
    .attr("transform", "rotate(-90)")
    .text("Distribution of signature contribution");

  // Remove axis line
  d3.select(".y-axis path").remove();
}

function boxPlotAxisX() {
  // Create x-axis container
  var xAxisContainer = d3.select("#visualization").append("svg")
    .attr("class", "x-axis")
    .style("margin-left", yAxisWidth)
    .attr("width", ((boxPlotMargin.left + boxPlotWidth + boxPlotMargin.right) * 30))
    .attr("height", 60);

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
      .attr("x", boxPlotMargin.left + (boxPlotWidth/2))
      .attr("dx", "-1.4em")
      .attr("dy", "1.5em")
      .attr("transform", "rotate(-90)" )
      .style("text-anchor", "end");

  // Remove axis line
  d3.select(".x-axis path").remove();

  // Highlight specific signatures
  d3.select(xAxisGroup[0][4]).attr("stroke", "blue");
}

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

  var d = d.map(Number).sort(d3.ascending);

  var pointsOfInterest = (thisBox.quartiles())(d);
  var whiskerIndices = (thisBox.whiskers())(d);
  pointsOfInterest.unshift(d[whiskerIndices[0]]);
  pointsOfInterest.push(d[whiskerIndices[1]]);

  var fontSize = 12;
  var rectHeight = (fontSize+6);

  var textContainer = boxContainer.append("svg").attr("class", "box-text");

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

function createBoxPlots() {
  var data = vizState["data"];

  boxPlotAxisY();

  var boxContainer = d3.select("#visualization")
    .append("svg")
      .attr("height", boxPlotHeight + boxPlotMargin.top + boxPlotMargin.bottom)
      .attr("width", 1260)
    .append("g").attr("id", "box-container");

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

  boxPlotAxisX();
}

function removeBoxPlots() {
  d3.select("#visualization").selectAll("svg.box").remove();
}


var jitterCheckbox = document.getElementById('switch');

jitterCheckbox.addEventListener('change', function() {
    if(this.checked) {
      addJitterPlots();
    } else {
      removeJitterPlots();
    }
});

function addJitterPlots() {
  var data = vizState["data"];
  var jitterRands = vizState["jitterRands"];
  var exposureThreshold = vizState["exposureThreshold"];
  var scatterYScale = d3.scale.linear().range([boxPlotHeight, 0]),
    scatterYMap = function(d) { return scatterYScale(d) + boxPlotMargin.top;};

  d3.select("#visualization").selectAll(".outlier").attr("display", "none");

  d3.select("#visualization").selectAll("svg.box").each(function(d, i) {
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
        if(d >= exposureThreshold) {
          return 0.2
        }
        return 0;
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

            var patientJitterDotText = currentBox.append("text")
              .text(data[boxIndex][jitterDotIndex].toFixed(2))
              .attr("class", "patient-jitter-text")
              .attr("x", 8)
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
      });
  });

  vizState["jitterPlots"] = true;
}

function removePatientJitterDots() {
  d3.select("#visualization").selectAll("svg.box > .patient-jitter-text").remove();
  d3.select("#visualization").selectAll("svg.box > .patient-jitter-dot").remove();
}

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
