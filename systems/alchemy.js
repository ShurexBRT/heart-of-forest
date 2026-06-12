import { RECIPE_DEFS } from "../data/recipeData.js";
import {
  addItem,
  getCurrency,
  getItemCount,
  removeItem,
  spendCurrency,
} from "./progression.js";

export function getUnlockedRecipes(progression) {
  return Object.values(RECIPE_DEFS).filter((recipe) => progression.unlockedRecipes?.[recipe.id]);
}

export function unlockRecipe(progression, recipeId) {
  if (!RECIPE_DEFS[recipeId]) return false;
  progression.unlockedRecipes = progression.unlockedRecipes || {};
  const changed = !progression.unlockedRecipes[recipeId];
  progression.unlockedRecipes[recipeId] = true;
  return changed;
}

export function getRecipeView(progression, recipeId) {
  const recipe = RECIPE_DEFS[recipeId];
  if (!recipe) return null;

  const ingredientEntries = Object.entries(recipe.ingredients).map(([itemId, required]) => ({
    itemId,
    required,
    owned: getItemCount(progression, itemId),
  }));
  const affordable =
    getCurrency(progression) >= recipe.costSilver &&
    ingredientEntries.every((entry) => entry.owned >= entry.required);

  return {
    ...recipe,
    ingredientEntries,
    affordable,
  };
}

export function craftRecipe(progression, recipeId) {
  const view = getRecipeView(progression, recipeId);
  if (!view || !progression.unlockedRecipes?.[recipeId]) {
    return { crafted: false, reason: "That recipe is not unlocked." };
  }
  if (!view.affordable) {
    return { crafted: false, reason: "More ingredients or silver are needed." };
  }

  for (const [itemId, amount] of Object.entries(view.ingredients)) {
    removeItem(progression, itemId, amount);
  }
  spendCurrency(progression, view.costSilver);
  addItem(progression, view.outputItemId, view.outputAmount);
  return { crafted: true, recipe: view };
}
