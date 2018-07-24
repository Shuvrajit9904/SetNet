/* eslint-disable */
import ControllerBase from "../base/ControllerBase.js";
import GraphView from "./GraphView.js";

class GraphController {
  constructor(el) {
    this.View = new GraphView(el);
  }

  createGraph(data, relations) {
    this.Graph = sessionStorage.graph;

    if (!this.Graph || true) {
      this.Graph = {
        node: [],
        link: [],        
      };

    let num_selected_filter = data[0].filterNames.length;
    let selected_node_list = [];
    let group_details_map = {}

    if(num_selected_filter > 0){

      data.forEach( d => {
        let membership_array = []
        let group_dict = {}
        // console.log("gd", group_dict)
        
        // Creating the Binary Array that corresponds to Group Number when converted to decimal
        d.membership.forEach( (d1, i) => {          
          if(d1){          
          if(group_dict[d.filterNames[i][0]]){
            group_dict[d.filterNames[i][0]].push(d.filterNames[i][1])
          }else{
            group_dict[d.filterNames[i][0]] = [d.filterNames[i][1]]
          }
            membership_array.push(1)
          }else{
            membership_array.push(0)
          }
        })    
        
        let group_details = ""
        Object.keys(group_dict).forEach( (key) => {

          group_details += key + ": " + group_dict[key].join(",") + ';\n'

        })

        
        var group_id_bin = parseInt(membership_array.join(''), 2)
        var group_id = group_id_bin.toString();


        group_details_map[group_id] = group_details;

        if (group_id_bin){
          selected_node_list.push(d.id)
          this.Graph.node.push({
            id: d.id ,
            group: group_id,
            name : d.name,
            // grp_details : group_details
          })
          
        }else{
          // Use this space to track nodes that doesn't belong to any selection
        }
      })

    }

    relations.customers.forEach( d => {        
      let source_id = d.Organization2ID,
          target_id = d.Organization1ID;

      if(selected_node_list.includes(source_id) && selected_node_list.includes(target_id) ){
        
        this.Graph.link.push({
          source : d.Organization2ID,
          target : d.Organization1ID
        })  
      }
    })    

    relations.suppliers.forEach( d => {        
      let source_id = d.Organization2ID,
          target_id = d.Organization1ID;

      if(selected_node_list.includes(source_id) && selected_node_list.includes(target_id) ){        
        this.Graph.link.push({
          source : d.Organization2ID,
          target : d.Organization1ID
        })  
      }
    })    

    
    this.View.update(this.Graph, group_details_map);
    } else {
      this.Graph = JSON.parse(this.Graph);
    }
  }

  update(data, relations) {    
    // if (!this.Graph)
    
    this.createGraph(data, relations);
    // this.View.update(this.Graph);
  }
}

export default GraphController;
