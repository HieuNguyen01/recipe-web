// src/pages/AddRecipePage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";
import MKInput from "components/MKInput";
import { createRecipe } from "services/api";

// Reuse RecipeCard styling from RecipePage
const RecipeCard = styled(Card)(({ theme }) => ({
  maxWidth: 800,
  margin: "0 auto",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  boxShadow: theme.shadows[3],
}));

export default function AddRecipePage() {
  const navigate = useNavigate();
  const [recipeData, setRecipeData] = useState({
    title: "",
    image: "",
    cookingTime: "",
    ingredients: [{ name: "", amount: "", unit: "" }],
    instructions: [""],
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

 // Derived validation flag
  const isSaveDisabled =
    !recipeData.title.trim() ||
    !recipeData.cookingTime.trim() ||
    recipeData.ingredients.length < 1 ||
    recipeData.instructions.length < 1;

  // Handlers for simple fields
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prev) => ({ ...prev, [name]: value }));
  };

  // Ingredient handlers
  const handleIngredientChange = (idx) => (e) => {
    const { name, value } = e.target;
    const newList = [...recipeData.ingredients];
    newList[idx][name] = value;
    setRecipeData((prev) => ({ ...prev, ingredients: newList }));
  };
  const addIngredient = () => {
    setRecipeData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", amount: "", unit: "" }],
    }));
  };
  const removeIngredient = (idx) => () => {
    setRecipeData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  // Instruction handlers
  const handleInstructionChange = (idx) => (e) => {
    const newList = [...recipeData.instructions];
    newList[idx] = e.target.value;
    setRecipeData((prev) => ({ ...prev, instructions: newList }));
  };
  const addInstruction = () => {
    setRecipeData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };
  const removeInstruction = (idx) => () => {
    setRecipeData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== idx),
    }));
  };

  // Save & Cancel
  const handleSave = () => {
    createRecipe({
      title: recipeData.title,
      description: recipeData.description,   // if you need a description field, adjust accordingly
      cookingTime: recipeData.cookingTime,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      image: recipeData.image,
    })
      .then(() => {
        setSuccess(true);
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to add recipe"));
  };
  const handleCancel = () => {
    navigate("/");
  };

  return (
    <MKBox component="main" py={6}>
      <Container maxWidth="md">
        <RecipeCard elevation={3}>
          {/* Heading */}
          <Box pt={3} px={2}>
            <MKTypography variant="h4" align="center">
              Add Recipe
            </MKTypography>
          </Box>

          {/* Form Body */}
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MKInput
                  fullWidth
                  required
                  name="title"
                  label="Title"
                  value={recipeData.title}
                  onChange={handleFieldChange}
                />
              </Grid>
              <Grid item xs={12}>
                <MKInput
                  fullWidth
                  name="description"
                  label="Description"
                  value={recipeData.description}
                  onChange={handleFieldChange}
                />
              </Grid>
              <Grid item xs={12}>
                <MKInput
                  fullWidth
                  name="image"
                  label="Image URL"
                  value={recipeData.image}
                  onChange={handleFieldChange}
                />
              </Grid>
              <Grid item xs={12}>
                <MKInput
                  fullWidth
                  required
                  name="cookingTime"
                  label="Cooking Time (min)"
                  value={recipeData.cookingTime}
                  onChange={handleFieldChange}
                />
              </Grid>

              {/* Ingredients */}
              <Grid item xs={12}>
                <MKTypography variant="h5" gutterBottom>
                  Ingredients
                </MKTypography>
                {recipeData.ingredients.map((ing, idx) => (
                  <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
                    <Grid item xs={5}>
                      <MKInput
                        fullWidth
                        name="name"
                        placeholder="Name"
                        value={ing.name}
                        onChange={handleIngredientChange(idx)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <MKInput
                        fullWidth
                        name="amount"
                        placeholder="Amount"
                        value={ing.amount}
                        onChange={handleIngredientChange(idx)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <MKInput
                        fullWidth
                        name="unit"
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={handleIngredientChange(idx)}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <MKButton color="error" size="small" onClick={removeIngredient(idx)}>
                        ×
                      </MKButton>
                    </Grid>
                  </Grid>
                ))}
                <MKButton onClick={addIngredient}>+ Add Ingredient</MKButton>
              </Grid>

              {/* Instructions */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <MKTypography variant="h5" gutterBottom>
                  Instructions
                </MKTypography>
                {recipeData.instructions.map((step, idx) => (
                  <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder={`Step ${idx + 1}`}
                        value={step}
                        onChange={handleInstructionChange(idx)}
                      />
                    </Grid>
                    <Grid item>
                      <MKButton color="error" size="small" onClick={removeInstruction(idx)}>
                        ×
                      </MKButton>
                    </Grid>
                  </Grid>
                ))}
                <MKButton onClick={addInstruction}>+ Add Step</MKButton>
              </Grid>
            </Grid>
          </CardContent>

          {/* Actions */}
          <CardActions sx={{ justifyContent: "center", pb: 3 }}>
            <MKButton color="success" onClick={handleSave} sx={{ mr: 1 }}>
              Save
            </MKButton>
            <MKButton color="secondary" onClick={handleCancel}>
              Cancel
            </MKButton>
          </CardActions>
        </RecipeCard>
      </Container>

      {/* Success Snackbar */}
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          Recipe added successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar open={Boolean(error)} autoHideDuration={2000} onClose={() => setError("")}>
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </MKBox>
  );
}
