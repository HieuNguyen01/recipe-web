// src/pages/AddRecipePage.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, CardContent, CardActions, Grid, Box, TextField, Button, 
  CircularProgress, FormControl, InputLabel, Select, MenuItem, Link,Typography, Breadcrumbs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";
import MKInput from "components/MKInput";
import { getUnits, createRecipe } from "services/api";
import useConfirmDialog from "ui/hooks/useConfirmDialog";

// RecipeCard styling
const RecipeCard = styled(Card)(({ theme }) => ({
  maxWidth: 800,
  margin: "0 auto",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  boxShadow: theme.shadows[3],
}));

const validUnits = [ "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece" ];

export default function AddRecipePage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
    // ← holds the list from /api/units
  const [validUnits, setValidUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [recipeData, setRecipeData] = useState({
    title: "",
    image: "",
    cookingTime: "",
    description: "",
    ingredients: [{ name: "", amount: "", unit: "" }],
    instructions: [""],
  });
  const [uploadError, setUploadError]     = useState("");
  const [isUploading, setIsUploading]     = useState(false);
  const {openConfirm, ConfirmDialogRender } = useConfirmDialog();

    // load units on mount
  useEffect(() => {
    getUnits()
      .then(units => {
        setValidUnits(units);
      })
      .catch(err => {
        console.error("Failed to load units", err);
        enqueueSnackbar("Could not load units list", { variant: "error" });
      })
      .finally(() => setLoadingUnits(false));
  }, [enqueueSnackbar]);

  const isSaveDisabled =
    !recipeData.title.trim() ||
    !recipeData.cookingTime.trim() ||
    recipeData.ingredients.length < 1 ||
    recipeData.instructions.length < 1;

  // ————— Image Picker & Base64 —————
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    if (!file.type.startsWith("image/")) {
      enqueueSnackbar("Please select a valid image file.", { variant: "error" });
      return;
    }
    const MAX = 2 * 1024 * 1024;
    if (file.size > MAX) {
      enqueueSnackbar("Image must be smaller than 2 MB.", { variant: "error" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setRecipeData((prev) => ({ ...prev, image: reader.result }));
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    };
    reader.onerror = () => {
      setIsUploading(false);
      enqueueSnackbar("Failed to read the file. Try another image.", {
        variant: "error",
      });
    };
  };

  // ————— Other field handlers (unchanged) —————
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientChange = (idx) => (e) => {
    const { name, value } = e.target;
    const newList = [...recipeData.ingredients];
    newList[idx][name] = value;
    setRecipeData((prev) => ({ ...prev, ingredients: newList }));
  };
  const addIngredient = () => setRecipeData((prev) => ({
    ...prev,
    ingredients: [...prev.ingredients, { name: "", amount: "", unit: "" }],
  }));
  const removeIngredient = (idx) => () => setRecipeData((prev) => ({
    ...prev,
    ingredients: prev.ingredients.filter((_, i) => i !== idx),
  }));

  const handleInstructionChange = (idx) => (e) => {
    const list = [...recipeData.instructions];
    list[idx] = e.target.value;
    setRecipeData((prev) => ({ ...prev, instructions: list }));
  };
  const addInstruction    = () => setRecipeData((prev) => ({
    ...prev,
    instructions: [...prev.instructions, ""],
  }));
  const removeInstruction = (idx) => () => setRecipeData((prev) => ({
    ...prev,
    instructions: prev.instructions.filter((_, i) => i !== idx),
  }));

const handleConfirmCreate = async () => {
  setIsUploading(true);
  try {
    await createRecipe({
      title:        recipeData.title,
      description:  recipeData.description,
      cookingTime:  recipeData.cookingTime,
      ingredients:  recipeData.ingredients,
      instructions: recipeData.instructions,
      image:        recipeData.image,
    });

    enqueueSnackbar("Recipe created successfully!", { variant: "success" });
    navigate("/");
  } catch (err) {
    enqueueSnackbar(
      err.response?.data?.message || "Failed to create recipe",
      { variant: "error" }
    );
  } finally {
    // stop the spinner whether success or failure
    setIsUploading(false);
  }
};


  // ————— Render —————
  return (
    <MKBox component="main" py={6}>
      <Container maxWidth="md">
        <Grid container>
          <Grid item xs={6}>
            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <Link
                underline="hover"
                color="inherit"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
                sx={{ cursor: "pointer" }}
              >
                Home
              </Link>
              <Typography color="text.primary">
                Recipe
              </Typography>
            </Breadcrumbs>
          </Grid>
          <Grid item xs={4}></Grid>
          <Grid item xs={2}>
            <MKButton
              fullWidth
              color="warning"
              onClick={() => navigate('/')}
            >
              Back to Home
            </MKButton>
          </Grid>
        </Grid>
        <RecipeCard elevation={3}>
          <Box pt={3} px={2}>
            <MKTypography variant="h4" align="center">
              Add Recipe
            </MKTypography>
          </Box>

          <CardContent>
            <Grid container spacing={2}>
              {/* Image uploader */}
              <Grid item xs={12} textAlign="center">
                {recipeData.image && (
                  <Box mt={2} textAlign="center">
                    <img
                      src={recipeData.image}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
                    />
                  </Box>
                )}
                <Button
                  variant="contained"
                  color="info"
                  component="label"
                  disabled={isUploading}
                >
                  {isUploading
                    ? <CircularProgress size={24} color="inherit" />
                    : "Upload Image"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              </Grid>

              {/* Title */}
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

              {/* Description */}
              <Grid item xs={12}>
                <MKInput
                  fullWidth
                  name="description"
                  label="Description"
                  value={recipeData.description}
                  onChange={handleFieldChange}
                />
              </Grid>

              {/* Cooking Time */}
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
                  <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    key={idx}
                    sx={{ mb: 1 }}
                  >
                    <Grid item xs={5}>
                      <MKInput
                        name="name"
                        placeholder="Name"
                        fullWidth
                        value={ing.name}
                        onChange={handleIngredientChange(idx)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <MKInput
                        name="amount"
                        placeholder="Amount"
                        fullWidth
                        value={ing.amount}
                        onChange={handleIngredientChange(idx)}
                      />
                    </Grid>
                    {/* Unit as Select */}
                    <Grid item xs={3}>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id={`unit-label-${idx}`}>Unit</InputLabel>
                        <Select
                          labelId={`unit-label-${idx}`}
                          id={`unit-select-${idx}`}
                          name="unit"
                          value={ing.unit}
                          label="Unit"
                          onChange={handleIngredientChange(idx)}
                          IconComponent={() => null}           // remove the dropdown arrow
                          sx={{
                            height: 44,                        // match your other small inputs
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              padding: "12px",
                              height: "100%",
                            }
                          }}
                        >
                          {validUnits.map((u) => (
                            <MenuItem key={u} value={u}>
                              {u}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>


                    </Grid>
                    <Grid item xs={1}>
                      <MKButton
                        color="error"
                        size="small"
                        onClick={removeIngredient(idx)}
                      >
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
                  <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    key={idx}
                    sx={{ mb: 1 }}
                  >
                    <Grid item xs={11}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder={`Step ${idx + 1}`}
                        value={step}
                        onChange={handleInstructionChange(idx)}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <MKButton
                        color="error"
                        size="small"
                        onClick={removeInstruction(idx)}
                      >
                        ×
                      </MKButton>
                    </Grid>
                  </Grid>
                ))}
                <MKButton onClick={addInstruction}>+ Add Step</MKButton>
              </Grid>
            </Grid>
          </CardContent>

          <CardActions sx={{ justifyContent: "center", pb: 3 }}>
            <MKButton
              disabled={isSaveDisabled || isUploading}
              sx={{ mr: 1 }}
              color="success"
              onClick={() =>
                openConfirm({
                  title:       "Confirm Create",
                  contentText: "Are you sure you want to create this recipe?",
                  confirmText: "Create",
                  cancelText:  "Cancel",
                  onConfirm:   handleConfirmCreate
                })
              }
            >
              {isUploading
                ? <CircularProgress color="inherit" size={20}/>
                : "Save"}
            </MKButton>
            <MKButton color="secondary" onClick={() => navigate("/")}>
              Cancel
            </MKButton>
          </CardActions>
        </RecipeCard>
      </Container>

      {/* ─── Confirm Dialog ─── */}
      <ConfirmDialogRender />
    </MKBox>
  );
}
