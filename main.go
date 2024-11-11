package main

import (
	"flag"
	"fmt"
	"math"
)

func main() {
	minPinion := flag.Int("minp", 8, "Minimum pinion teeth")
	maxPinion := flag.Int("maxp", 16, "Maximum pinion teeth")
	minWheel := flag.Int("minw", 60, "Minimum wheel teeth")
	maxWheel := flag.Int("maxw", 140, "Maximum wheel teeth")
	shafts := flag.Int("shafts", 4, "Number of shafts")
	targetRatio := flag.Float64("ratio", 1440.0, "Target ratio")
	tolerance := flag.Float64("tol", 0.00, "Acceptable ratio tolerance (percentage)")
	flag.Parse()

	findGearTrains(*minPinion, *maxPinion, *minWheel, *maxWheel, *shafts, *targetRatio, *tolerance)
}

func findGearTrains(minPinion, maxPinion, minWheel, maxWheel, shafts int, targetRatio, tolerance float64) {
	wheels := make([]int, shafts)  // Output wheels on each shaft
	pinions := make([]int, shafts) // Input pinions on each shaft (first shaft has no pinion)

	var search func(int)
	search = func(shaft int) {
		if shaft == shafts {
			if checkRatio(wheels, pinions, targetRatio, tolerance) {
				printGearTrain(wheels, pinions)
			}
			return
		}

		// For the first shaft, we only need to try wheels
		if shaft == 0 {
			for wheel := minWheel; wheel <= maxWheel; wheel++ {
				wheels[shaft] = wheel
				search(shaft + 1)
			}
			return
		}

		// For the last shaft, we only need to try pinions
		if shaft == shafts-1 {
			for pinion := minPinion; pinion <= maxPinion; pinion++ {
				pinions[shaft] = pinion
				search(shaft + 1)
			}
			return
		}

		// For middle shafts, try all combinations of wheels and pinions
		for pinion := minPinion; pinion <= maxPinion; pinion++ {
			for wheel := minWheel; wheel <= maxWheel; wheel++ {
				pinions[shaft] = pinion
				wheels[shaft] = wheel
				search(shaft + 1)
			}
		}
	}

	search(0)
}

func checkRatio(wheels, pinions []int, targetRatio float64, tolerance float64) bool {
	// Calculate numerator (product of all wheels)
	numerator := wheels[0]
	for i := 1; i < len(wheels)-1; i++ {
		numerator *= wheels[i]
	}

	// Calculate denominator (product of all pinions)
	denominator := 1
	for i := 1; i < len(pinions); i++ {
		denominator *= pinions[i]
	}

	if tolerance == 0.0 {
		// For exact matching, check if the ratio can be achieved with integer arithmetic
		targetNumerator := int(targetRatio) * denominator
		return targetNumerator == numerator
	}

	// For non-zero tolerance, check if ratio is within tolerance
	ratio := float64(numerator) / float64(denominator)
	return math.Abs(ratio-targetRatio)/targetRatio <= tolerance/100.0
}

func printGearTrain(wheels, pinions []int) {
	// Calculate ratio
	numerator := wheels[0]
	for i := 1; i < len(wheels)-1; i++ {
		numerator *= wheels[i]
	}
	denominator := 1
	for i := 1; i < len(pinions); i++ {
		denominator *= pinions[i]
	}
	ratio := float64(numerator) / float64(denominator)

	// Print output
	for i := 0; i < len(wheels); i++ {
		if i == 0 {
			fmt.Printf("Shaft %d: Wheel: %d\n", i+1, wheels[i])
		} else if i == len(wheels)-1 {
			fmt.Printf("Shaft %d: Pinion: %d\n", i+1, pinions[i])
		} else {
			fmt.Printf("Shaft %d: Pinion: %d, Wheel: %d\n", i+1, pinions[i], wheels[i])
		}
	}
	fmt.Printf("Ratio: %.3f\n\n", ratio)
}
