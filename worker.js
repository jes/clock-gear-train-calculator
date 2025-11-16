function nestedLoopIterations(n, levels) {
    let result = 1;

    // Calculate n * (n + 1) * (n + 2) * ... * (n + levels - 1)
    for (let i = 0; i < levels; i++) {
        result *= (n + i);
    }

    // Divide by levels! (factorial of levels)
    for (let i = 1; i <= levels; i++) {
        result /= i;
    }

    return result;
}

function calculateTotalCombinations(params) {
    const wheelRange = params.maxWheel - params.minWheel + 1;
    const pinionRange = params.maxPinion - params.minPinion + 1;

    // Number of configurations for wheels and pinions
    const wheelConfigs = nestedLoopIterations(wheelRange, params.shafts - 1);
    const pinionConfigs = nestedLoopIterations(pinionRange, params.shafts - 1);

    // Total configurations
    return wheelConfigs * pinionConfigs;
}

function calculateRatio(wheels, pinions) {
    let numerator = wheels[0];
    for (let i = 1; i < wheels.length - 1; i++) {
        numerator *= wheels[i];
    }

    let denominator = 1;
    for (let i = 1; i < pinions.length; i++) {
        denominator *= pinions[i];
    }

    return {
        numerator,
        denominator,
        ratio: numerator / denominator
    };
}

function checkRatio(wheels, pinions, targetRatio, tolerance) {
    const { ratio, denominator, numerator } = calculateRatio(wheels, pinions);
    return tolerance === 0 ?
        targetRatio * denominator === numerator :
        Math.abs(ratio - targetRatio) / targetRatio <= tolerance / 100.0;
}

function formatResult(wheels, pinions) {
    let result = '';
    const { ratio } = calculateRatio(wheels, pinions);

    for (let i = 0; i < wheels.length; i++) {
        if (i === 0) {
            result += `Shaft ${i + 1}: Wheel: ${wheels[i]}\n`;
        } else if (i === wheels.length - 1) {
            result += `Shaft ${i + 1}: Pinion: ${pinions[i]}\n`;
        } else {
            result += `Shaft ${i + 1}: Pinion: ${pinions[i]}, Wheel: ${wheels[i]}\n`;
        }
    }
    result += `Ratio: ${ratio}\n\n`;
    return result;
}

self.onmessage = function(e) {
    const params = e.data;
    const totalCombinations = calculateTotalCombinations(params);
    let processed = 0;
    
    const wheels = new Array(params.shafts).fill(0);
    const pinions = new Array(params.shafts).fill(0);

    function search(shaft, prevWheel, prevPinion) {
        for (let pinion = params.minPinion; pinion <= prevPinion; pinion++) {
            pinions[shaft] = pinion;
            if (shaft === params.shafts - 1) {
                // last shaft: report progress and check ratio
                if (++processed % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        value: (processed / totalCombinations) * 100
                    });
                }
                if (checkRatio(wheels, pinions, params.targetRatio, params.tolerance)) {
                    const { ratio } = calculateRatio(wheels, pinions);
                    self.postMessage({
                        type: 'result',
                        text: formatResult(wheels, pinions),
                        result: {
                            wheels: [...wheels],
                            pinions: [...pinions],
                            ratio
                        }
                    });
                }
            } else {
                // not last shaft: pick a wheel and recurse
                for (let wheel = params.minWheel; wheel <= prevWheel; wheel++) {
                    wheels[shaft] = wheel;
                    search(shaft + 1, wheel, pinion);
                }
            }
        }
    }

    // first shaft: pick a wheel and search the rest of the shafts
    for (let wheel = params.minWheel; wheel <= params.maxWheel; wheel++) {
        wheels[0] = wheel;
        search(1, wheel, params.maxPinion);
    }

    self.postMessage({ type: 'complete' });
}; 