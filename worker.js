function calculateTotalCombinations(params) {
    // First shaft (wheel only)
    let total = params.maxWheel - params.minWheel + 1;
    
    // For each middle shaft
    let maxPossibleWheel = params.maxWheel;
    for (let i = 1; i < params.shafts - 1; i++) {
        const pinionsPerShaft = params.maxPinion - params.minPinion + 1;
        let wheelCombinations = 0;
        
        // For each possible previous wheel size
        for (let prevWheel = params.maxWheel; prevWheel >= params.minWheel; prevWheel--) {
            // Count wheels that are <= prevWheel
            const possibleWheels = Math.min(prevWheel, params.maxWheel) - params.minWheel + 1;
            wheelCombinations += possibleWheels;
        }
        
        // Average number of wheel combinations per previous wheel
        const avgWheelCombinations = wheelCombinations / (params.maxWheel - params.minWheel + 1);
        total *= (pinionsPerShaft * avgWheelCombinations);
    }
    
    // Last shaft (pinion only)
    total *= params.maxPinion - params.minPinion + 1;
    
    return Math.floor(total);
}

function checkRatio(wheels, pinions, targetRatio, tolerance) {
    let numerator = wheels[0];
    for (let i = 1; i < wheels.length - 1; i++) {
        numerator *= wheels[i];
    }

    let denominator = 1;
    for (let i = 1; i < pinions.length; i++) {
        denominator *= pinions[i];
    }

    const ratio = numerator / denominator;
    return tolerance === 0 ?
        Math.floor(targetRatio) * denominator === numerator :
        Math.abs(ratio - targetRatio) / targetRatio <= tolerance / 100.0;
}

function formatResult(wheels, pinions) {
    let result = '';
    const numerator = wheels.slice(0, -1).reduce((a, b) => a * b, 1);
    const denominator = pinions.slice(1).reduce((a, b) => a * b, 1);
    const ratio = numerator / denominator;

    for (let i = 0; i < wheels.length; i++) {
        if (i === 0) {
            result += `Shaft ${i + 1}: Wheel: ${wheels[i]}\n`;
        } else if (i === wheels.length - 1) {
            result += `Shaft ${i + 1}: Pinion: ${pinions[i]}\n`;
        } else {
            result += `Shaft ${i + 1}: Pinion: ${pinions[i]}, Wheel: ${wheels[i]}\n`;
        }
    }
    result += `Ratio: ${ratio.toFixed(3)}\n\n`;
    return result;
}

self.onmessage = function(e) {
    const params = e.data;
    const totalCombinations = calculateTotalCombinations(params);
    let processed = 0;
    
    const wheels = new Array(params.shafts).fill(0);
    const pinions = new Array(params.shafts).fill(0);
    
    function search(shaft, prevWheel) {
        if (shaft === params.shafts) {
            if (checkRatio(wheels, pinions, params.targetRatio, params.tolerance)) {
                self.postMessage({
                    type: 'result',
                    text: formatResult(wheels, pinions)
                });
            }
            return;
        }

        if (shaft === 0) {
            for (let wheel = params.minWheel; wheel <= params.maxWheel; wheel++) {
                wheels[shaft] = wheel;
                processed++;
                if (processed % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        value: (processed / totalCombinations) * 100
                    });
                }
                search(shaft + 1, wheel);
            }
            return;
        }

        if (shaft === params.shafts - 1) {
            for (let pinion = params.minPinion; pinion <= params.maxPinion; pinion++) {
                pinions[shaft] = pinion;
                processed++;
                if (processed % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        value: (processed / totalCombinations) * 100
                    });
                }
                search(shaft + 1, 0);
            }
            return;
        }

        for (let pinion = params.minPinion; pinion <= params.maxPinion; pinion++) {
            for (let wheel = params.minWheel; wheel <= Math.min(params.maxWheel, prevWheel); wheel++) {
                pinions[shaft] = pinion;
                wheels[shaft] = wheel;
                processed++;
                if (processed % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        value: (processed / totalCombinations) * 100
                    });
                }
                search(shaft + 1, wheel);
            }
        }
    }

    search(0, Infinity);
    self.postMessage({ type: 'complete' });
}; 