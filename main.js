let worker = null;

document.getElementById('gearForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous results and initialize solution count
    let solutionCount = 0;
    document.getElementById('solutionCount').textContent = 'Solutions found: 0';
    document.getElementById('results').textContent = '';
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    const progress = document.getElementById('progress');
    loadingIndicator.classList.add('active');
    progress.style.display = 'block';
    
    // Terminate existing worker if any
    if (worker) {
        worker.terminate();
    }
    
    // Create new worker
    worker = new Worker('worker.js');
    
    // Get form values
    const params = {
        minPinion: parseInt(document.getElementById('minp').value),
        maxPinion: parseInt(document.getElementById('maxp').value),
        minWheel: parseInt(document.getElementById('minw').value),
        maxWheel: parseInt(document.getElementById('maxw').value),
        shafts: parseInt(document.getElementById('shafts').value),
        targetRatio: parseFloat(document.getElementById('ratio').value),
        tolerance: document.getElementById('allowTolerance').checked ? 
            parseFloat(document.getElementById('tol').value) : 0
    };
    
    // Send data to worker
    worker.postMessage(params);
    
    // Handle messages from worker
    worker.onmessage = function(e) {
        if (e.data.type === 'progress') {
            document.getElementById('progress').value = e.data.value;
            document.getElementById('progressPercent').textContent = 
                Math.round(e.data.value);
        } else if (e.data.type === 'result') {
            solutionCount++;
            document.getElementById('solutionCount').textContent = 
                `Solutions found: ${solutionCount}`;
            document.getElementById('results').textContent += e.data.text;
        } else if (e.data.type === 'complete') {
            loadingIndicator.classList.remove('active');
            if (solutionCount === 0) {
                document.getElementById('results').innerHTML = 'No solutions found.';
            }
            worker.terminate();
            worker = null;
        }
    };
});

document.getElementById('allowTolerance').addEventListener('change', function(e) {
    document.getElementById('toleranceGroup').style.display = 
        e.target.checked ? 'block' : 'none';
}); 