import { getRecipeImageDataUri } from "services/api/images";

/**
 * Given an array of recipes where recipe.image is a filename,
 * return a new array where recipe.image is a data:URI string.
 */
export function hydrateImages(recipes) {
  return Promise.all(
    recipes.map(async (r) => {
      // already a Data-URI? skip
      if (r.image?.startsWith("data:")) {
        return r;
      }
      // no image? skip
      if (!r.image) {
        return r;
      }
      try {
        const { image: dataUri } = await getRecipeImageDataUri(r.id);
        return { ...r, image: dataUri };
      } catch {
        // on error, leave the filename alone
        return r;
      }
    })
  );
}
