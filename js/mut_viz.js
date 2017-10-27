var boxPlotMargin = {top: 10, right: 10, bottom: 20, left: 10},
    boxPlotWidth = 40 - boxPlotMargin.left - boxPlotMargin.right,
    boxPlotHeight = 400 - boxPlotMargin.top - boxPlotMargin.bottom;

var yAxisWidth = 100;

var chart = d3.box()
    .whiskers(iqr(1.5))
    .width(boxPlotWidth)
    .height(boxPlotHeight);



d3.csv("../viz/data/signature_distributions_t.csv", function(error, csv) {
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

  chart.domain([0, 0.9]);

  // Create y-axis container
  var yAxisContainer = d3.select("#yaxis").append("svg")
          .attr("class", "y-axis")
          .attr("width", yAxisWidth)
          .attr("height", boxPlotHeight + boxPlotMargin.top + boxPlotMargin.bottom)
          .style("display", "inline")
          .style("float", "left");

  // Create y-axis scale (based on plot size)
  var yAxisScale = d3.scale.linear()
      .domain([0, 0.9])
      .range([boxPlotHeight, 0]);

  // Create y-axis
  var yAxis = d3.svg.axis()
                     .scale(yAxisScale)
                     .ticks(5)
                     .orient("left");


  // Call xAxis, append as SVG, rotate labels to be vertical
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


  d3.select("path").remove();

  // Create box plots
  var svg = d3.select("#visualization").selectAll("svg")
      .data(data)
    .enter().append("svg")
      .attr("class", "box")
      .attr("width", boxPlotWidth + boxPlotMargin.left + boxPlotMargin.right)
      .attr("height", boxPlotHeight + boxPlotMargin.bottom + boxPlotMargin.top)
    .append("g")
      .attr("transform", "translate(" + boxPlotMargin.left + "," + boxPlotMargin.top + ")")
      .call(chart);

  // Create x-axis container
  var xAxisContainer = d3.select("#visualization").append("svg")
      .style("margin-left", yAxisWidth)
      .attr("width", ((boxPlotMargin.left + boxPlotWidth + boxPlotMargin.right) * 30))
      .attr("height", 100);




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
