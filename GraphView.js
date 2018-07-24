/* eslint-disable */
import ViewBase from "../base/ViewBase.js";
import * as d3 from "d3";

class GraphView extends ViewBase {
  constructor(el) {
    super(el);
    this.canvas = d3
      .select(this.baseElement)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100vh");
  }

update(data, group_details_map) {

  this.canvas.html("");



  let   width = this.canvas.node().getBoundingClientRect().width,
        height = this.canvas.node().getBoundingClientRect().height,
        dr = 4,      // default point radius
        off = 5,    // cluster hull offset
        expand = {}, // expanded clusters
        net, simulation, hullg, hull, linkg, link, nodeg, node;    

  let curve = d3.line()
        .curve(d3.curveCardinalClosed.tension(0.85))
        // .interpolate("cardinal-closed")
          // .tension(.85);

  var fill = d3.scaleOrdinal(d3.schemeCategory10);

  // var fill = d3.schemeCategory20;

  function noop() { return false; }

  function nodeid(n) {
    return n.size ? "_g_"+(n.group != undefined ? n.group : "1") : n.id;
  }
    
  function linkid(l) {
    // console.log("l", l)
    var u = nodeid(l.source),
        v = nodeid(l.target);
    return u<v ? u+"|"+v : v+"|"+u;
  }
    
  function getGroup(n) {  
    return n.group != undefined ? n.group : "1"
  }
  
  function network(data, prev, expand) {   
    // console.log("data", data) 
      
    expand = expand || {};
    let group_map = {},    // group map
        node_map = {},    // node map
        link_map = {},    // link map
        prev_group_nodes = {},    // previous group nodes
        prev_group_cent = {},    // previous group centroids
        nodes = [], // output nodes
        links = []; // output links
  
    
    
    // process previous nodes for reuse or centroid calculation
    if (prev) {
        // console.log("Am i ever here")
        prev.nodes.forEach(function(n) {
          // console.log("n", n)          
          var i = n.group != undefined ? n.group : "1", o;
          if (n.size > 0) {
            prev_group_nodes[i] = n;
            n.size = 0;
          } else {
            o = prev_group_cent[i] || (prev_group_cent[i] = {x: 0,y: 0,count:0});
            o.x += n.x;
            o.y += n.y;
            o.count += 1;
          }
        });
      }

    // determine nodes
    for (var k=0; k<data.node.length; ++k){
    
    var n = data.node[k],        
        i = n.group != undefined ? n.group : "1",
        l = group_map[i] || (group_map[i]=prev_group_nodes[i]) || (group_map[i]={group:i, size:0, nodes:[]});        
    
    
    if (expand[i]) {
      // the node should be directly visible
      node_map[n.id] = nodes.length;
      nodes.push(n);
      // console.log("n, location:prev, new", n, prev_group_nodes[i].x, n.x)
      if (prev_group_nodes[i]) {
        // place new nodes at cluster location (plus jitter)        
        n.x = prev_group_nodes[i].x + Math.random();
        n.y = prev_group_nodes[i].y + Math.random();       
      }
       
      // nodes.push(n);
      // console.log("n", n)
      
    } else {
      // the node is part of a collapsed cluster      
      if (l.size == 0) {
        
        // if new cluster, add to set and position at centroid of leaf nodes        
        node_map[i] = nodes.length;
        nodes.push(l);
        if (prev_group_cent[i]) {
          l.x = prev_group_cent[i].x / prev_group_cent[i].count;
          l.y = prev_group_cent[i].y / prev_group_cent[i].count;
        }
      }      
      l.nodes.push(n);
    }
  // console.log("n", n)    
  // always count group size as we also use it to tweak the force graph strengths/distances
    l.size += 1;
    n.group_data = l;
  }
// console.log("nodes", nodes)

  for (i in group_map) { 
    // console.log(i)
    group_map[i].link_count = 0;     
  }
  // console.log("group_map", group_map)

  // determine links  
  for (k=0; k<data.link.length; ++k) {

    var e = data.link[k],
        u = sourcetargetgroup(e.source) || "1",
        v = sourcetargetgroup(e.target) || "1";
  
  
  // if(u && v){    
  if (u != v) {
    group_map[u].link_count++;
    group_map[v].link_count++;
  }
    // if (expand[u]) console.log(e)
    u = expand[u] ? (node_map[e.source] != undefined ? node_map[e.source] : "1" ) : (node_map[u] != undefined ? node_map[u] : "1" );
    v = expand[v] ? (node_map[e.target] != undefined ? node_map[e.target] : "1" ) : (node_map[v] != undefined ? node_map[v] : "1");
    
    // if(u && v){
    var i = (u<v ? u+"|"+v : v+"|"+u),
        l = link_map[i] || (link_map[i] = {source: u, target: v, size:0});      
      // console.log("l", l)
    l.size += 1;
  // }else{
  //   console.log("uv", u, v)
  // }

  // }  
  
}

// console.log("link_map", link_map)

for (i in link_map) { links.push(link_map[i]); }

return {nodes: nodes, links: links};

}


function sourcetargetgroup(esrctarget){
  
  // let esource = e.source;
  for(let idx = 0; idx < data.node.length; ++ idx){
    if(data.node[idx].id == esrctarget){
        
        return data.node[idx].group != undefined ? data.node[idx].group : "1"  ;
            
    }    
  }
}

function convexHulls(nodes, offset) {

  
  var hulls = {};
  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;

    var i = n.group != undefined ? n.group : "1",
        l = hulls[i] || (hulls[i] = []);
    // console.log("i", i);
    
    l.push([n.x-offset, n.y-offset]);
    l.push([n.x-offset, n.y+offset]);
    l.push([n.x+offset, n.y-offset]);
    l.push([n.x+offset, n.y+offset]);
  }
  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.polygonHull(hulls[i])});
  }
  return hullset;
}

function drawCluster(d) {
  return curve(d.path); // 0.8
}

function isArray(arr) {
  return arr.constructor.toString().indexOf("Array") > -1;
}

var body = d3
.select(this.baseElement);

// var vis = body.append("svg")
//    .attr("width", width)
//    .attr("height", height);
var vis = this.canvas;

  hullg = vis.append("g");
  linkg = vis.append("g");
  nodeg = vis.append("g");

  init();

  vis.attr("opacity", 1e-6)
    .transition()
      .duration(1000)
      .attr("opacity", 1);

function init() {
  if (simulation) simulation.stop();
  
  net = network(data, net, expand);
  console.log("what:", net)

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  simulation = d3.forceSimulation()
    // .nodes(net.nodes)        
    .force("link", d3.forceLink().strength((l, i ) => {return 1})
    .distance((l, i) => {
      
      var n1 = l.source, n2 = l.target;      
    // larger distance for bigger groups:
    // both between single nodes and _other_ groups (where size of own node group still counts),
    // and between two group nodes.
    //
    // reduce distance for groups with very few outer links,
    // again both in expanded and grouped form, i.e. between individual nodes of a group and
    // nodes of another group or other group node or between two group nodes.
    //
    // The latter was done to keep the single-link groups ('blue', rose, ...) close.
    return 100 +
      Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
                             (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
           -30 +
           30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
                         (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
           200);
    // return 250;
    })
  )    
    // .links(net.links)
    .force("center", d3.forceCenter(width / 2, height / 2))    
    .force("xAxis",d3.forceX((d) => {
      // console.log(d);
      return d.x;
    }))
    .force("yAxis",d3.forceY((d) => {
      return d.y;
    }))
    .force("charge", d3.forceManyBody().strength(-10))
    .alphaDecay(0.05)
    // .restart()
    .velocityDecay(0.8)

    simulation
    .nodes(net.nodes)


  simulation.force("link")
    .links(net.links);

  
  hullg.selectAll("path.hull").remove();
  hull = hullg.selectAll("path.hull")
      .data(convexHulls(net.nodes, off))

  var hullEnter = hull.enter().append("path")
  hull = hullEnter.merge(hull).attr("class", "hull")
      .attr("d", drawCluster)
      .style("fill", function(d) { 
        return fill(d.group); })
      .on("click", function(d) {
      console.log("hull click", d, arguments, this, expand[d.group ? d.group : "1"]); 
      let gid;
      if(d.group != "undefined"){               
        gid = d.group
      }     
      else{
        gid = "1"
      }      
      
      expand[gid] = false; init();
    });        
    


  link = linkg.selectAll("line.link").data(net.links, linkid)
  link.exit().remove();

  let linkEnter = link.enter().append("line");

  link = linkEnter.merge(link);
  linkEnter.attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })

  node = nodeg
    // .selectAll("circle.node")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(net.nodes, nodeid)
  node.exit().remove();

  let nodeEnter = node.enter().append("circle");
  // node = nodeEnter.merge(node);
  nodeEnter.attr("class", function(d) { return "node" + (d.size ? "" : " leaf"); })
      .attr("r", (d) =>  { return d.size ? Math.sqrt(d.size) + dr : dr; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("fill", function(d) { return color(d.group); })
      .on("click", function(d) {              
              console.log("node click", d, arguments, this, expand[d.group]);            
              let gid = d.group != undefined ? d.group : "1"
              
              expand[gid] = !expand[gid];              
              
              init();
            })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged));
          // .on("end", dragended));

  nodeEnter.append("title")
    .text(function(d) { return d.id ? d.name : group_details_map[d.group] });  


  node = nodeEnter.merge(node);

  // simulation
  //   .nodes(net.nodes)
  //   .on("tick", ticked);

  // simulation.force("link")
  //   .links(net.links);

  simulation.on("tick", ticked)          

  function ticked() {
    if (!hull.empty()) {
      hull.data(convexHulls(net.nodes, off))
          .attr("d", drawCluster);
    }

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    
  }

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

  }

}

export default GraphView;