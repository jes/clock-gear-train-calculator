function calculateTotalCombinations(params) {
    const middleShafts = params.shafts - 2;
    const firstShaftCombos = params.maxWheel - params.minWheel + 1;
    const lastShaftCombos = params.maxPinion - params.minPinion + 1;
    const middleShaftCombos = (params.maxPinion - params.minPinion + 1) * 
                             (params.maxWheel - params.minWheel + 1);
    
    let total = firstShaftCombos;
    for (let i = 0; i < middleShafts; i++) {
        total *= middleShaftCombos;
    }
    total *= lastShaftCombos;
    return total;
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

    if (tolerance === 0.0) {
        const targetNumerator = Math.floor(targetRatio) * denominator;
        return targetNumerator === numerator;
    }

    const ratio = numerator / denominator;
    return Math.abs(ratio - targetRatio) / targetRatio <= tolerance / 100.0;
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
    
    function search(shaft) {
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
                search(shaft + 1);
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
                search(shaft + 1);
            }
            return;
        }

        for (let pinion = params.minPinion; pinion <= params.maxPinion; pinion++) {
            for (let wheel = params.minWheel; wheel <= params.maxWheel; wheel++) {
                pinions[shaft] = pinion;
                wheels[shaft] = wheel;
                processed++;
                if (processed % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        value: (processed / totalCombinations) * 100
                    });
                }
                search(shaft + 1);
            }
        }
    }

    search(0);
    self.postMessage({ type: 'complete' });
}; 