let worker = null;

document.getElementById('gearForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous results
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
        tolerance: parseFloat(document.getElementById('tol').value)
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
            document.getElementById('results').textContent += e.data.text;
        } else if (e.data.type === 'complete') {
            loadingIndicator.classList.remove('active');
            if (!document.getElementById('results').textContent) {
                document.getElementById('results').textContent = 
                    'No solutions found.';
            }
            worker.terminate();
            worker = null;
        }
    };
}); 