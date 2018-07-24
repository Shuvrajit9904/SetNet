#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jul 24 12:05:47 2018

@author: shuvrajit
"""

from collections import defaultdict
import numpy as np
import pandas as pd
import json

def egotwitterprocess(feat_appears_more_than = 9, edges_file = 'data/12831.edges', node_feat_file = 'data/12831.feat', feature_name_file = 'data/12831.featnames' ):
    
    #edges_file = 'data/12831.edges'
    
    with open(edges_file) as f:
        f_r = f.read()
        all_edges = f_r.split('\n')
        
    class Graph:
     
        # Constructor
        def __init__(self):
     
            # default dictionary to store graph
            self.graph = defaultdict(list)
     
        # function to add an edge to graph
        def addEdge(self,u,v):
            self.graph[u].append(v)
     
    g = Graph()
    
    links = []
    nodes = []
    attributes = []
    
        
        
    #node_feat_file = 'data/12831.feat'
    with open(node_feat_file) as f:
        f_r = f.read()
        all_node_feat = f_r.split('\n')
    
    for nodeft in all_node_feat:
        node_ft = nodeft.split()
        if len(node_ft)  > 0:
            node = node_ft[0]
    #        all_features = node_ft[1:]
    #        print(node)
            nodes.append(node)
            attributes.append(node_ft)
    
    df_feat = pd.DataFrame(np.asarray(attributes).astype(int))
    
    useful = [0]
    
    for clm in df_feat:
    #    vals.append(sum(df_feat[clm]))
        if clm != 0 and sum(df_feat[clm]) > feat_appears_more_than:
            useful.append(clm)
            
    df_reqd_feat = df_feat[useful]
    
    nodes = []
    nodeidlist = []
    
    for index, rows in df_reqd_feat.iterrows():
        d = {}
        node = rows[0]
        feats = df_reqd_feat.loc[index]
        if sum(feats)-node > 0:
            d["id"] = str(node)
            nodeidlist.append(node)
            for feat_idx in useful[1:]:
                d[str(feat_idx)] = str(feats[feat_idx])
            nodes.append(d)
        
        
    for edges in all_edges:
        uv = edges.split()
        if len(uv) == 2:
            u, v = uv
            if int(u) in nodeidlist and int(v) in nodeidlist:
                g.addEdge(u, v)
                links.append({"source" : str(u), "target" : str(v)})
                
    features = {}
    #feature_name_file = 'data/12831.featnames'
    
    with open(feature_name_file) as f:
        f_r = f.read()
        all_feat_names = f_r.split('\n')
        
    
    for feats in all_feat_names:
        idname = feats.split()
        if len(idname) == 2:
            _id, name = idname
            if int(_id) in useful[1:]:
                features[str(_id)] = name
                
    
    graph = {
                "nodes" : nodes,
                "links" : links,
                "features" : features
            }
    return graph


graph = egotwitterprocess()

with open('data/twitter12831.json', 'w') as outfile:
    json.dump(graph, outfile)
    
    
    
    
    
