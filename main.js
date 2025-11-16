let worker = null;
let results = []; // Store results for CSV export
let searchStartTime = null; // Add this line to store start time
let targetRatio = null; // Store target ratio for sorting

document.getElementById('gearForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous results and initialize solution count
    let solutionCount = 0;
    results = []; // Clear stored results
    searchStartTime = Date.now(); // Add this line to capture start time
    document.getElementById('solutionCount').textContent = 'Solutions found: 0';
    document.getElementById('results').textContent = '';
    document.getElementById('exportCsv').style.display = 'none';
    document.getElementById('stopCalculation').style.display = 'block';
    
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
    targetRatio = parseFloat(document.getElementById('ratio').value);
    const params = {
        minPinion: parseInt(document.getElementById('minp').value),
        maxPinion: parseInt(document.getElementById('maxp').value),
        minWheel: parseInt(document.getElementById('minw').value),
        maxWheel: parseInt(document.getElementById('maxw').value),
        shafts: parseInt(document.getElementById('shafts').value),
        targetRatio: targetRatio,
        tolerance: document.getElementById('allowTolerance').checked ? 
            parseFloat(document.getElementById('tol').value) : 0
    };
    
    // Send data to worker
    worker.postMessage(params);
    
    // Handle messages from worker
    worker.onmessage = function(e) {
        if (e.data.type === 'progress') {
            const progressValue = e.data.value;
            document.getElementById('progress').value = progressValue;
            document.getElementById('progressPercent').textContent = 
                Math.round(progressValue);
        } else if (e.data.type === 'result') {
            solutionCount++;
            results.push(e.data.result);
            
            // Sort results by closeness to target ratio
            results.sort((a, b) => {
                const diffA = Math.abs(a.ratio - targetRatio);
                const diffB = Math.abs(b.ratio - targetRatio);
                return diffA - diffB;
            });
            
            updateSolutionCount(solutionCount);
            renderResults();
        } else if (e.data.type === 'complete') {
            stopCalculation(false); // false means natural completion
        }
    };
});

// Add CSV export functionality
document.getElementById('exportCsv').addEventListener('click', function() {
    const csvContent = generateCsv(results);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gear_train_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

function generateCsv(results) {
    // Create dynamic headers based on maximum number of shafts
    const maxShafts = Math.max(...results.map(r => r.wheels.length));
    const headers = ['Ratio'];
    for (let i = 0; i < maxShafts-1; i++) {
        headers.push(`Shaft ${i+1} wheel`, `Shaft ${i+2} pinion`);
    }
    
    let csv = headers.join(',') + '\n';
    
    // Create one row per solution
    results.forEach(result => {
        const row = [result.ratio];
        for (let i = 0; i < maxShafts; i++) {
            row.push(result.wheels[i] || '');
            if (i < maxShafts - 1) {
                row.push(result.pinions[i + 1] || '');
            }
        }
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

document.getElementById('allowTolerance').addEventListener('change', function(e) {
    document.getElementById('toleranceGroup').style.display = 
        e.target.checked ? 'block' : 'none';
});

document.getElementById('stopCalculation').addEventListener('click', function() {
    if (worker) {
        stopCalculation(true); // true means stopped by user
    }
});

function stopCalculation(stoppedByUser) {
    // Calculate duration
    const duration = ((Date.now() - searchStartTime) / 1000).toFixed(1);
    
    // Update count with progress before hiding elements
    updateSolutionCount(results.length, stoppedByUser, duration);
    
    if (worker) {
        worker.terminate();
        worker = null;
    }
    
    // Reset UI
    document.getElementById('loadingIndicator').classList.remove('active');
    document.getElementById('progress').style.display = 'none';
    document.getElementById('stopCalculation').style.display = 'none';
    
    if (stoppedByUser) {
        document.getElementById('results').textContent += '\nCalculation stopped by user.\n';
    }

    if (results.length === 0) {
        document.getElementById('results').innerHTML = '';
    } else {
        document.getElementById('exportCsv').style.display = 'block';
    }
}

function updateSolutionCount(count, stopped = false, duration = null) {
    const progressElement = document.getElementById('progressPercent');
    const searchProgress = progressElement ? 
        ` (searched ${progressElement.textContent}%)` : '';
    const durationText = duration ? ` in ${duration}s` : '';
    const suffix = stopped ? searchProgress : '';
    document.getElementById('solutionCount').textContent = 
        `Solutions found: ${count}${durationText}${suffix}`;
}

function renderResults() {
    let output = '';
    results.forEach(result => {
        for (let i = 0; i < result.wheels.length; i++) {
            if (i === 0) {
                output += `Shaft ${i + 1}: Wheel: ${result.wheels[i]}\n`;
            } else if (i === result.wheels.length - 1) {
                output += `Shaft ${i + 1}: Pinion: ${result.pinions[i]}\n`;
            } else {
                output += `Shaft ${i + 1}: Pinion: ${result.pinions[i]}, Wheel: ${result.wheels[i]}\n`;
            }
        }
        output += `Ratio: ${result.ratio}\n\n`;
    });
    document.getElementById('results').textContent = output;
} 