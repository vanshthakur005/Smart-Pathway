document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('canvas');
  const addEdgeBtn = document.getElementById('add-edge-btn');
  const runBtn = document.getElementById('run-btn');
  const resetBtn = document.getElementById('reset-btn');
  const sourceNodeInput = document.getElementById('source-node');
  const resultsContainer = document.getElementById('results');
  let nodes = [];
  let edges = [];
  let nodeCount = 0;
  let isAddEdgeMode = false;
  let firstNode = null;
  
  canvas.addEventListener('click', function(e) {
    if (isAddEdgeMode || e.target !== canvas) return;
    
    if (nodeCount >= 12) {
      alert('Maximum 12 nodes allowed!');
      return;
    }

    if (nodeCount === 0) canvas.innerHTML = '';
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    createNode(x, y);
  });
  
  function createNode(x, y) {
    const node = document.createElement('div');
    node.className = 'node';
    node.textContent = nodeCount;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    
    node.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isAddEdgeMode) {
        handleNodeSelect(parseInt(this.textContent));
      }
    });
    
    canvas.appendChild(node);
    nodes.push({ id: nodeCount, x, y, element: node });
    nodeCount++;
  }
  
  addEdgeBtn.addEventListener('click', function() {
    if (nodes.length < 2 && !isAddEdgeMode) {
      alert('You need at least 2 nodes to create an edge!');
      return;
    }

    isAddEdgeMode = !isAddEdgeMode;
    this.classList.toggle('active', isAddEdgeMode);
    this.textContent = isAddEdgeMode ? 'Stop Adding Edges' : 'Add Edge';
    
    if (firstNode !== null) {
      nodes[firstNode].element.style.border = '3px solid #e0e0e0';
    }
    firstNode = null;
    if(isAddEdgeMode) alert('Add Edge mode is ON. Select two nodes to connect.');
  });
  
  function handleNodeSelect(nodeId) {
    if (firstNode === null) {
      firstNode = nodeId;
      nodes[nodeId].element.style.border = '3px solid #FFD700';
    } else {
      if (firstNode === nodeId) return;

      const edgeExists = edges.some(edge => 
        (edge.from === firstNode && edge.to === nodeId) ||
        (edge.from === nodeId && edge.to === firstNode)
      );
      
      if (!edgeExists) {
        createEdge(firstNode, nodeId);
      } else {
        alert('Edge already exists between these nodes!');
      }
      
      nodes[firstNode].element.style.border = '3px solid #e0e0e0';
      firstNode = null;
    }
  }
  
  function createEdge(from, to) {
    const fromNode = nodes[from];
    const toNode = nodes[to];
    
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const weight = Math.round(distance / 10);
    
    const edge = document.createElement('div');
    edge.className = 'edge';
    edge.style.width = `${distance}px`;
    edge.style.left = `${fromNode.x}px`;
    edge.style.top = `${fromNode.y}px`;
    edge.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    
    const weightLabel = document.createElement('div');
    weightLabel.className = 'weight';
    weightLabel.textContent = weight;
    weightLabel.style.left = `${(fromNode.x + toNode.x) / 2}px`;
    weightLabel.style.top = `${(fromNode.y + toNode.y) / 2}px`;
    
    canvas.appendChild(edge);
    canvas.appendChild(weightLabel); // comment 
    
    // Store the element with the edge data
    edges.push({ from, to, weight, element: edge });
  }
  runBtn.addEventListener('click', function() {
    // First, clear any previous path highlights
    for (const edge of edges) {
        edge.element.classList.remove('path');
    }

    const source = parseInt(sourceNodeInput.value);
    
    if (isNaN(source) || source < 0 || source >= nodeCount) {
      alert('Please enter a valid source node!');
      return;
    }
    
    const dist = new Array(nodeCount).fill(Infinity);
    const prev = new Array(nodeCount).fill(null);
    dist[source] = 0;
    
    const pq = [{ node: source, dist: 0 }];

    while(pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const { node: u, dist: d } = pq.shift();

        if (d > dist[u]) continue;

        for (const edge of edges) {
            let v = -1;
            if(edge.from === u) v = edge.to;
            else if(edge.to === u) v = edge.from;

            if (v !== -1) {
                const alt = dist[u] + edge.weight;
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                    pq.push({ node: v, dist: alt });
                }
            }
        }
    }
    
    // Highlight the edges in the shortest path tree
    for (let i = 0; i < nodeCount; i++) {
        if (prev[i] !== null) {
            const u = prev[i];
            const v = i;

            // Find the corresponding edge element to highlight
            const edgeToHighlight = edges.find(edge =>
                (edge.from === u && edge.to === v) || (edge.from === v && edge.to === u)
            );

            if (edgeToHighlight) {
                edgeToHighlight.element.classList.add('path');
            }
        }
    }

    displayResults(dist, prev, source);
  });
  
  function displayResults(dist, prev, source) {
    resultsContainer.innerHTML = '';
    if (nodeCount === 0) {
        resultsContainer.innerHTML = '<p class="result-item">Results will be shown here.</p>';
        return;
    }

    for (let i = 0; i < nodeCount; i++) {
      const path = [];
      if (dist[i] === Infinity) {
        path.push('Unreachable');
      } else {
        let curr = i;
        while (curr !== null) {
          path.unshift(curr);
          curr = prev[curr];
        }
      }
      
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      resultItem.textContent = `Node ${i}: Cost = ${dist[i] === Infinity ? '∞' : dist[i]}, Path = ${path.join(' → ')}`;
      resultsContainer.appendChild(resultItem);
    }
  }
  
  resetBtn.addEventListener('click', function() {
    canvas.innerHTML = '<p style="color: #666;">Click anywhere to add nodes</p>';
    resultsContainer.innerHTML = '<p class="result-item">Results will be shown here.</p>';
    nodes = [];
    edges = [];
    nodeCount = 0;
    isAddEdgeMode = false;
    firstNode = null;
    sourceNodeInput.value = '';
    addEdgeBtn.classList.remove('active');
    addEdgeBtn.textContent = 'Add Edge';
  });
});