// import "./styles.css";

// import GraphController from "../GraphView/GraphController.js";


// var Graph = new GraphController(d3.select("#graph-view").node());

let canvas = d3.select("#graph-container")
      .append("svg")
      .attr("width", "75%")
      .attr("height", "95vh");

var action_bar = d3.select("#graph-container")
    .append("div")
    .attr("class", "action-bar")
    .text("test")

var centralities = ["Highest degree", "Betweenness Centrality", "Closeness Centrality", "Degree Centrality"]
var select_numbers = []
  for(var i = 0; i < 20; ++i){
    select_numbers.push(i+1);
  }
let num_ind = 5;

var select = action_bar.append("select") 
  .attr("class", "centrality-select") 

  select.selectAll("option")
  .data(centralities)
  .enter()
  .append("option")
  .attr("value", (d, i) => {
    return i;
  })
  .text((d) => {
    return d;
  })
  
  let changed_type_ind = 0

  select.on("change", function() {
    changed_type_ind = this.options[this.selectedIndex].value;
    creategraph(changed_type_ind, num_ind)
  })


var select_numbers = []
  for(var i = 0; i < 20; ++i){
    select_numbers.push(i+1);
  }

  // console.log("graph", graph)
  var select_num = action_bar.append("select")
    .attr("class", "num-select")

  select_num.selectAll("option")
  .data(select_numbers)
  .enter()
  .append("option")
  .attr("value", (d, i) => {
    return d;
  })
  .property("selected", (d,i) =>{
    return d == 5;
  })
  .text((d) => {
    return d;
  })

  select_num.on("change", function() {

    num_ind = this.options[this.selectedIndex].value;
    creategraph(changed_type_ind, num_ind)
    
  })



// Create initial graph highlighting highest degrees
creategraph(0, num_ind)


function creategraph(cent_ind, num_ind){

d3.select("svg").html("")  

var svg = d3.select("svg"),
    width = canvas.node().getBoundingClientRect().width,
    height = canvas.node().getBoundingClientRect().height;
// svg.attr("width", "100%").attr("height", "95vh");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("miserables_edit.json", function(error, graph) {
  if (error) throw error;


  
  var central = highdegreenodes(graph, num_ind, cent_ind);

  var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr("r", function(d) { 
        if(central.includes(d.id)){
          return 7.5;
        }else{
          return 5;
        }        
      })
      .attr("fill", function(d) { 
        if(central.includes(d.id)){
          return "#800000"
        }else{
          return "#aec7e8"
        }        
      })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}



}


function adjacencyList(data){
  var adjlist = {}
  data.forEach((d, i) => {
    
    src = d.source ;
    tgt = d.target ;

    if(adjlist[src]){
      adjlist[src].push(tgt) ;
    }else{
      adjlist[src] = [tgt] ;
    }

    if(adjlist[tgt]){
      adjlist[tgt].push(src) ;
    }else{
      adjlist[tgt] = [src] ;
    }    
  })

  return adjlist;
}

function highdegreenodes(data, count, cent_ind){

  adjlist = adjacencyList(data.links);
  var degreeDict = {}

  for(key in adjlist){
    degreeDict[key] = [adjlist[key].length]    
  }

  data.nodes.forEach( (d, i) => {
    degreeDict[d.id].push(d.Betweenness)
    degreeDict[d.id].push(d.Closeness)
    degreeDict[d.id].push(d.Degree)    
  })

  // Create items array
  var items = Object.keys(degreeDict).map(function(key) {
    return [key, degreeDict[key]];
  });

  // Sort the array based on the second element
  items.sort(function(first, second) {
    return second[1][cent_ind] - first[1][cent_ind];
  });

  
  var highestdeg = [];
  for(var i = 0; i < count; ++i){
    highestdeg.push(items[i][0])
  }
  return highestdeg;
}
