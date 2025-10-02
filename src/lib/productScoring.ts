export interface ProductData {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  rating: string;
  calories: number;
  fat: number;
  sodium: number;
  sugar: number;
  protein: number;
  carbs: number;
  productimage: string;
}

const MAX_CALORIES = 2000;
const MAX_FAT = 70;
const MAX_SODIUM = 2300;
const MAX_SUGAR = 50;
const MIN_PROTEIN = 50;

interface ProductRating {
  score: number;
  rating: number;
  highlights: string[];
  ratingDetails: {
    calories: number;
    fat: number;
    sodium: number;
    sugar: number;
  };
}

// --- Category-specific scoring algorithms ---

function scoreChocolate(product: ProductData): { score: number; breakdown: { calories: number; sugar: number; fat: number; sodium: number; carbs: number } } {
  let score = 0;
  let breakdown = { calories: 0, sugar: 0, fat: 0, sodium: 0, carbs: 0 };

  // Calories (Max 15)
  if (product.calories <= 400) {
    score += 15; breakdown.calories = 15;
  } else if (product.calories <= 500) {
    score += 10; breakdown.calories = 10;
  } else {
    score += 5; breakdown.calories = 5;
  }

  // Sugar (Max 30)
  if (product.sugar <= 5) {
    score += 30; breakdown.sugar = 30;
  } else if (product.sugar <= 15) {
    score += 20; breakdown.sugar = 20;
  } else if (product.sugar <= 25) {
    score += 10; breakdown.sugar = 10;
  } else {
    score += 5; breakdown.sugar = 5;
  }

  // Fat (Max 20)
  if (product.fat <= 10) {
    score += 20; breakdown.fat = 20;
  } else if (product.fat <= 20) {
    score += 15; breakdown.fat = 15;
  } else if (product.fat <= 30) {
    score += 10; breakdown.fat = 10;
  } else {
    score += 5; breakdown.fat = 5;
  }

  // Sodium (Max 5)
  if (product.sodium <= 50) {
    score += 5; breakdown.sodium = 5;
  } else if (product.sodium <= 100) {
    score += 3; breakdown.sodium = 3;
  } else {
    score += 0; breakdown.sodium = 0;
  }

  // Carbs (Max 10)
  if (product.carbs <= 20) {
    score += 10; breakdown.carbs = 10;
  } else if (product.carbs <= 40) {
    score += 5; breakdown.carbs = 5;
  } else {
    score += 2; breakdown.carbs = 2;
  }

  // Protein (Max 10) - not included in breakdown
  if (product.protein >= 5) {
    score += 10;
  } else if (product.protein >= 2) {
    score += 5;
  } else {
    score += 2;
  }

  return { score: Math.round(score), breakdown };
}


function scoreSoftDrink(product: ProductData): {
  score: number;
  breakdown: { calories: number; sugar: number; sodium: number; fat: number };
} {
  let score = 0;
  const breakdown = { calories: 0, sugar: 0, sodium: 0, fat: 0 };

  // Calories: 100/100 for zero
  if (product.calories === 0) {
    score += 20; breakdown.calories = 20;
  } else {
    score += 5; breakdown.calories = 5;
  }

  // Sugar: 100/100 for zero
  if (product.sugar === 0) {
    score += 20; breakdown.sugar = 20;
  } else {
    score += 5; breakdown.sugar = 5;
  }

  // Sodium: 85/100 for sodium ≤ 5
  if (product.sodium <= 5) {
    score += 17; breakdown.sodium = 17;
  } else {
    score += 5; breakdown.sodium = 5;
  }

  // Fat: 100/100 for zero
  if (product.fat === 0) {
    score += 20; breakdown.fat = 20;
  } else {
    score += 5; breakdown.fat = 5;
  }

  return { score: Math.round(score), breakdown };
}

function scoreSnack(product: ProductData): number {
  let score = 0;

  if (product.calories <= 200) {
    score += 15;
  } else if (product.calories <= 400) {
    score += 10;
  } else {
    score += 5;
  }

  if (product.sugar <= 2) {
    score += 20;
  } else if (product.sugar <= 5) {
    score += 15;
  } else if (product.sugar <= 10) {
    score += 10;
  } else {
    score += 5;
  }

  if (product.fat <= 3) {
    score += 20;
  } else if (product.fat <= 10) {
    score += 15;
  } else {
    score += 5;
  }

  if (product.sodium <= 120) {
    score += 15;
  } else if (product.sodium <= 250) {
    score += 10;
  } else {
    score += 5;
  }

  if (product.carbs !== undefined && product.carbs <= 20) {
    score += 10;
  } else {
    score += 5;
  }

  if (product.protein >= 5) {
    score += Math.min(product.protein * 2, 20);
  } else {
    score += 5;
  }

  return Math.round(score);
}

const categoryAlgorithms: Record<string, (product: ProductData) => any> = {
  'soft-drink': scoreSoftDrink,
  'snack': scoreSnack,
  'chocolate': scoreChocolate,
};

export function calculateProductRating(product: ProductData): ProductRating {
  let calorieScore = product.calories > 0 
    ? 20 - (product.calories / MAX_CALORIES * 20)
    : 10;
  
  let fatScore = product.fat > 0 
    ? 20 - (product.fat / MAX_FAT * 20)
    : 15;
  
  let sodiumScore = product.sodium > 0 
    ? 20 - (product.sodium / MAX_SODIUM * 20)
    : 15;
  
  let sugarScore = product.sugar > 0 
    ? 20 - (product.sugar / MAX_SUGAR * 20)
    : 15;
  
  let proteinScore = product.protein > 0 
    ? (product.protein / MIN_PROTEIN * 20)
    : 10;

  let nutritionScore: number;
  let breakdownOverride = undefined;
  console.log('Product category at runtime:', product.category);


  if (product.category && categoryAlgorithms[product.category.toLowerCase()]) {
    const result = categoryAlgorithms[product.category.toLowerCase()](product);
    if (typeof result === 'object' && result.score !== undefined && result.breakdown !== undefined) {
      nutritionScore = result.score;
      breakdownOverride = result.breakdown;
    } else {
      nutritionScore = result;
    }
  } else {
    const totalWeight = 5;
    nutritionScore = Math.round(
      ((calorieScore + fatScore + sodiumScore + sugarScore + proteinScore) / totalWeight) * 2
    );
  }

  let rating = nutritionScore;

  if (product.protein >= MIN_PROTEIN * 1.5) {
    rating += 10;
  }

  if (product.sodium > MAX_SODIUM * 0.7) {
    rating -= 10;
  }

  rating = Math.max(0, Math.min(100, rating));

  const highlights: string[] = [];

  if (product.category?.toLowerCase() === 'soft-drink') {
    if (rating >= 85) {
      highlights.push('Excellent soft drink choice!');
    } else if (rating >= 70) {
      highlights.push('Good soft drink choice');
    } else if (rating >= 50) {
      highlights.push('Moderate soft drink choice');
    } else {
      highlights.push('Unhealthy soft drink');
    }

    if (product.sugar <= 5) highlights.push('Low sugar content');
    if (product.calories <= 25) highlights.push('Low calorie');
    if (product.fat === 0) highlights.push('Fat-free');
  } else {
    if (rating >= 90) {
      highlights.push('Excellent nutritional profile!');
    } else if (rating >= 70) {
      highlights.push('Good nutritional balance');
    } else if (rating >= 50) {
      highlights.push('Moderate nutritional value');
    } else {
      highlights.push('Needs improvement');
    }

    if (product.calories > 0 && product.calories <= MAX_CALORIES * 0.7) {
      highlights.push('Low calorie');
    }
    if (product.fat > 0 && product.fat <= MAX_FAT * 0.7) {
      highlights.push('Low fat');
    }
    if (product.sodium > 0 && product.sodium <= MAX_SODIUM * 0.7) {
      highlights.push('Low sodium');
    }
    if (product.sugar > 0 && product.sugar <= MAX_SUGAR * 0.7) {
      highlights.push('Low sugar');
    }
    if (product.protein >= MIN_PROTEIN * 1.5) {
      highlights.push('High protein');
    }
    if (product.calories === 0) highlights.push('Zero calories');
    if (product.fat === 0) highlights.push('Zero fat');
    if (product.sugar === 0) highlights.push('Zero sugar');
  }

  return {
    score: nutritionScore,
    rating,
    highlights,
    ratingDetails: breakdownOverride ? {
      calories: breakdownOverride.calories * 5,
      fat: breakdownOverride.fat * 5,
      sodium: breakdownOverride.sodium * 5,
      sugar: breakdownOverride.sugar * 5
    } : {
      calories: Math.round(calorieScore * 5),
      fat: Math.round(fatScore * 5),
      sodium: Math.round(sodiumScore * 5),
      sugar: Math.round(sugarScore * 5)
    }
  };
}

export function generateHighlights(product: ProductData, score: number): string[] {
  const highlights: string[] = [];

  if (score >= 90) highlights.push('Excellent nutritional profile!');
  else if (score >= 70) highlights.push('Good nutritional balance');

  if (product.calories <= MAX_CALORIES * 0.7) highlights.push('Low calorie');
  if (product.fat <= MAX_FAT * 0.7) highlights.push('Low fat');
  if (product.sodium <= MAX_SODIUM * 0.7) highlights.push('Low sodium');
  if (product.sugar <= MAX_SUGAR * 0.7) highlights.push('Low sugar');
  if (product.protein >= MIN_PROTEIN * 1.5) highlights.push('High protein');

  return highlights;
}

export function findAlternatives(
  products: ProductData[],
  currentProduct: ProductData,
  category: string
): ProductData[] {
  const alternatives = products.filter(
    p => p.category === category && p.barcode !== currentProduct.barcode
  );

  const currentRating = calculateProductRating(currentProduct).score;
  console.log('Current product score:', currentRating, 'barcode:', currentProduct.barcode);
  const scoredAlternatives = alternatives.map(product => {
    const rating = calculateProductRating(product);
    console.log('Alternative barcode:', product.barcode, 'score:', rating.score);
    return {
      ...product,
      score: rating.score,
      highlights: rating.highlights
    };
  });
  const filtered = scoredAlternatives.filter(product => product.score > currentRating);
  console.log('Filtered alternatives (better only):', filtered.map(p => ({ barcode: p.barcode, score: p.score })));
  return filtered.sort((a, b) => b.score - a.score);
}
