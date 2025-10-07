document.addEventListener('DOMContentLoaded', function() {
    // MinHeap (Priority Queue) implementation
    class MinHeap {
        constructor() {
            this.heap = [];
        }

        getParentIndex(i) {
            return Math.floor((i - 1) / 2);
        }

        getLeftChildIndex(i) {
            return 2 * i + 1;
        }

        getRightChildIndex(i) {
            return 2 * i + 2;
        }

        swap(i1, i2) {
            [this.heap[i1], this.heap[i2]] = [this.heap[i2], this.heap[i1]];
        }

        // Renamed from siftUp
        heapifyUp(index) {
            let parentIndex = this.getParentIndex(index);
            while (index > 0 && this.heap[index].dist < this.heap[parentIndex].dist) {
                this.swap(index, parentIndex);
                index = parentIndex;
                parentIndex = this.getParentIndex(index);
            }
        }

        // Renamed from siftDown
        heapifyDown(index) {
            let minIndex = index;
            const leftIndex = this.getLeftChildIndex(index);
            const rightIndex = this.getRightChildIndex(index);
            const size = this.heap.length;

            if (leftIndex < size && this.heap[leftIndex].dist < this.heap[minIndex].dist) {
                minIndex = leftIndex;
            }

            if (rightIndex < size && this.heap[rightIndex].dist < this.heap[minIndex].dist) {
                minIndex = rightIndex;
            }

            if (index !== minIndex) {
                this.swap(index, minIndex);
                this.heapifyDown(minIndex);
            }
        }

        // Renamed from insert
        push(value) {
            this.heap.push(value);
            this.heapifyUp(this.heap.length - 1);
        }

        // Renamed from extractMin
        pop() {
            if (this.heap.length === 0) {
                return null;
            }
            if (this.heap.length === 1) {
                return this.heap.pop();
            }
            const min = this.heap[0];
            this.heap[0] = this.heap.pop();
            this.heapifyDown(0);
            return min;
        }

        // Renamed from isEmpty
        empty() {
            return this.heap.length === 0;
        }
    }


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
        nodes.push({
            id: nodeCount,
            x,
            y,
            element: node
        });
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
        if (isAddEdgeMode) alert('Add Edge mode is ON. Select two nodes to connect.');
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

        const edgeData = {
            from,
            to,
            weight,
            element: edge,
            weightLabelElement: weightLabel
        };

        weightLabel.addEventListener('click', (e) => {
            e.stopPropagation();

            const newWeightStr = prompt(`Enter new weight for edge ${from} ↔ ${to}:`, edgeData.weight);

            if (newWeightStr !== null) {
                const newWeight = parseInt(newWeightStr, 10);
                if (!isNaN(newWeight) && newWeight >= 0) {
                    edgeData.weight = newWeight;
                    weightLabel.textContent = newWeight;
                } else {
                    alert('Invalid weight. Please enter a non-negative integer.');
                }
            }
        });

        canvas.appendChild(edge);
        canvas.appendChild(weightLabel);

        edges.push(edgeData);
    }


    runBtn.addEventListener('click', function() {
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

        const pq = new MinHeap();
        // Updated function call
        pq.push({
            node: source,
            dist: 0
        });

        // Updated function call
        while (!pq.empty()) {
            // Updated function call
            const {
                node: u,
                dist: d
            } = pq.pop();

            if (d > dist[u]) continue;

            for (const edge of edges) {
                let v = -1;
                if (edge.from === u) v = edge.to;
                else if (edge.to === u) v = edge.from;

                if (v !== -1) {
                    const alt = dist[u] + edge.weight;
                    if (alt < dist[v]) {
                        dist[v] = alt;
                        prev[v] = u;
                        // Updated function call
                        pq.push({
                            node: v,
                            dist: alt
                        });
                    }
                }
            }
        }

        for (let i = 0; i < nodeCount; i++) {
            if (prev[i] !== null) {
                const u = prev[i];
                const v = i;

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