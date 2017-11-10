var boxPlotMargin = {top: 20, right: 10, bottom: 20, left: 10},
    boxPlotWidth = 40 - boxPlotMargin.left - boxPlotMargin.right,
    boxPlotHeight = 400 - boxPlotMargin.top - boxPlotMargin.bottom;

var yAxisWidth = 100;

var chart = d3.box()
    .whiskers(iqr(1.5))
    .width(boxPlotWidth)
    .height(boxPlotHeight)
    .domain([0,1]);

d3.csv("data/signature_distributions_t.csv", function(error, csv) {
  if (error) throw error;

  var data = [];

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

  createBoxPlots(data);

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
  var yAxisGroup = yAxisContainer.append("g")
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
  d3.select("path").remove();
}

function boxPlotAxisX() {
  // Create x-axis container
  var xAxisContainer = d3.select("#visualization").append("svg")
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
  d3.select("path").remove();

  // Highlight specific signatures
  // d3.select(xAxisGroup[0][4]).attr("stroke", "blue");
}

function createBoxPlots(data) {

  boxPlotAxisY();

  var boxContainer = d3.select("#visualization")
    .append("svg")
      .attr("height", boxPlotHeight + boxPlotMargin.top + boxPlotMargin.bottom)
      .attr("width", 1200)
    .append("g").attr("class", "box-container");

  // Create box plots
  boxContainer.selectAll("svg")
      .data(data)
    .enter().append("svg")
      .attr("class", "box")
      .attr("width", boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)
      .attr("height", boxPlotHeight + boxPlotMargin.bottom + boxPlotMargin.top)
      .attr("x", function(d, i) { return ((boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right) * i)})
      .attr("y", 0)
    .append("g")
      .attr("transform", "translate(" + boxPlotMargin.left + "," + boxPlotMargin.top + ")")
      .call(chart)
      .on('mouseover', function(d, index) {
        var d = d.map(Number).sort(d3.ascending);
        console.log(index);
        var fontSize = 12;
        var thisBox = d3.box(d);
        var quartiles = (thisBox.quartiles())(d);
        console.log(quartiles);
        var textContainer = boxContainer.append("svg").attr("class", "box-text");

        var whiskerIndices = (thisBox.whiskers())(d);
        for(var wIndex = 0; wIndex < whiskerIndices.length; wIndex++) {
          var currentWhisker = d[whiskerIndices[wIndex]];
          textContainer.append("circle")
              .attr("fill", "#999")
              .attr("r", 3+fontSize+3)
              .attr("cx", boxPlotMargin.left + (3+fontSize+3)/2 + (index * (boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)))
              .attr("cy", boxPlotMargin.top + boxPlotHeight - ((boxPlotHeight) * currentWhisker) );
          textContainer.append("text")
              .text(currentWhisker.toFixed(2))
              .attr("font-size", "" + fontSize + "px")
              .attr("fill", "black")
              .attr("x", -4 + boxPlotMargin.left + (index * (boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)))
              .attr("y", boxPlotMargin.top + boxPlotHeight - ((boxPlotHeight) * currentWhisker) + 4);
        }

        for(var qIndex = 0; qIndex < quartiles.length; qIndex++) {
          var currentQuartile = quartiles[qIndex];
          textContainer.append("circle")
              .attr("fill", "#999")
              .attr("r", 3+fontSize+3)
              .attr("cx", boxPlotMargin.left + (3+fontSize+3)/2 + (index * (boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)))
              .attr("cy", boxPlotMargin.top + boxPlotHeight - ((boxPlotHeight) * currentQuartile) );
          textContainer.append("text")
              .text(currentQuartile.toFixed(2))
              .attr("font-size", "" + fontSize + "px")
              .attr("fill", "black")
              .attr("x", -4 + boxPlotMargin.left + (index * (boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)))
              .attr("y", boxPlotMargin.top + boxPlotHeight - ((boxPlotHeight) * currentQuartile) + 4);
        }

      })
      .on("mouseleave", function(d, index) {
        boxContainer.selectAll(".box-text").remove();
      });

  boxPlotAxisX();

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
  var width = boxPlotWidth + boxPlotMargin.left,
    height = boxPlotHeight + boxPlotMargin.top;

  var scatterYScale = d3.scale.linear().range([boxPlotHeight, 0]),
    scatterYMap = function(d) { return scatterYScale(d) + boxPlotMargin.top;};

  d3.select("#visualization").selectAll(".box").each(function(d, i) {
    var g = d3.select(this);
    g.selectAll(".dot")
      .data(d)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return Math.random()*(width/2) + (width/4) + (boxPlotMargin.left/2); })
      .attr("cy", scatterYMap)
      .style("fill", "#000000")
      .style("opacity", "0.2");
  });
}

function removeJitterPlots() {
  d3.select("#visualization").selectAll(".box").each(function(d, i) {
    var g = d3.select(this);
    g.selectAll(".dot").remove();
  });
}
