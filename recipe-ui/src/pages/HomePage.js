// src/pages/HomePage.js

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";
import { Container, Grid, Card, CardMedia, TextField, CardContent, CardActions, Icon, Dialog,
  DialogActions, DialogContent, Button, Box, Alert, Menu, MenuItem, Divider
} from "@mui/material";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKInput from "components/MKInput";
import MKButton from "components/MKButton";
import MKPagination from "components/MKPagination";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ArchiveIcon from "@mui/icons-material/Archive";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { getMe, getRecipes, login, register, setAuthToken, updateRecipe } from "services/api";

// Styled Dialog for consistent padding
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

// Styled Menu
const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "rgb(55, 65, 81)",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, " +
      "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, " +
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, " +
      "rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
        ...theme.applyStyles("dark", { color: "inherit" }),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
    ...theme.applyStyles("dark", {
      color: theme.palette.grey[300],
    }),
  },
}));

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editOpen, setEditOpen]       = useState(false);
  const [editData, setEditData]       = useState(null);
  const [editError, setEditError]     = useState("");

  // Read from the URL
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const titleParam = searchParams.get("title") || "";
  const ingredientParam = searchParams.get("ingredient") || "";
  const limit = 3;

  // recipes + pagination
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(titleParam);

  // auth + modal + user info
  const [authTokenState, setAuthTokenState] = useState("");
  const [userName, setUserName] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [successMessage, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Keep local `page` in sync when the user clicks pagination
  useEffect(() => {
    setSearchParams(params => {
      params.set("page", page);
      return params;
    });
  }, [page, setSearchParams]);

  // Whenever page, title, or ingredient in the URL changes, re-fetch
  useEffect(() => {
    getRecipes({
      page,
      limit,
      title: titleParam,
      ingredient: ingredientParam,
    })
      .then(({ recipes: data, pagination }) => {
        setRecipes(data);
        setTotalPages(pagination.totalPages);
      })
      .catch(console.error);
  }, [page, titleParam, ingredientParam]);

  // initial load: grab token & user from sessionStorage
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (token) {
      setAuthTokenState(token);
      setAuthToken(token);
      if (user.name) setUserName(user.name);
    }
  }, []);

  // Handle the search form (Enter key)
  const handleSearchSubmit = e => {
    e.preventDefault();
    // Reset to first page on new search
    setPage(1);
    setSearchParams(params => {
      params.set("title", searchTerm);
      params.set("page", 1);
      return params;
    });
  };

  // dialog controls
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccess("");
    setErrorMessage("");
  };
  const switchToLogin = () => {
    setMode("login");
    setErrorMessage("");
  };
  const switchToRegister = () => {
    setMode("register");
    setErrorMessage("");
  };
  const showSuccessAndClose = (msg, callback) => {
    setSuccess(msg);
    setTimeout(() => {
      handleClose();
      if (callback) callback();
    }, 1500);
  };
  const showError = (msg, callback) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage("");
      if (callback) callback();
    }, 1000);
  };
  
  // LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      // 1) Log in
      const { token } = await login({
        email: form.get("email"),
        password: form.get("password"),
      });

      // 2) persist & apply
      sessionStorage.setItem("token", token);
      setAuthToken(token);
      setAuthTokenState(token);

      // 3) get profile
      const user = await getMe();
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem('userId', user._id || user.id);
      setUserName(user.name || "");

      showSuccessAndClose("Login successful!", () => navigate());
    } catch (err) {
      showError(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  // REGISTER
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await register({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      });
      showSuccessAndClose(
        "Registration successful! Please log in.",
        switchToLogin
      );
    } catch (err) {
      console.error("Registration failed:", err);
      // TODO: show error to user
    }
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setAuthToken("");
    setAuthTokenState("");
    setUserName("");
    setPage(1);
  };

  // menu state + handlers
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };


  // open the edit dialog with a deep‐copy of this recipe
  const handleEditOpen = (recipe) => {
    setEditData({
      id: recipe.id,
      image: recipe.image,
      title: recipe.title,
      cookingTime: recipe.cookingTime,
      ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
      instructions: [...recipe.instructions]
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
    setEditError("");
  };

  // Update a top‐level field
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((d) => ({ ...d, [name]: value }));
  };

  // Ingredient helpers
  const handleIngredientChange = (i, field, value) => {
    const ing = [...editData.ingredients];
    ing[i][field] = value;
    setEditData((d) => ({ ...d, ingredients: ing }));
  };
  const handleAddIngredient = () => {
    setEditData((d) => ({
      ...d,
      ingredients: [...d.ingredients, { name: "", amount: "", unit: "" }],
    }));
  };
  const handleRemoveIngredient = (i) => {
    setEditData((d) => ({
      ...d,
      ingredients: d.ingredients.filter((_, idx) => idx !== i),
    }));
  };

  // Instruction helpers
  const handleInstructionChange = (i, value) => {
    const ins = [...editData.instructions];
    ins[i] = value;
    setEditData((d) => ({ ...d, instructions: ins }));
  };
  const handleAddInstruction = () => {
    setEditData((d) => ({
      ...d,
      instructions: [...d.instructions, ""],
    }));
  };
  const handleRemoveInstruction = (i) => {
    setEditData((d) => ({
      ...d,
      instructions: d.instructions.filter((_, idx) => idx !== i),
    }));
  };

  // Save back to the server
  const handleEditSave = async () => {
    try {
      await updateRecipe(editData.id, {
        image: editData.image,
        title: editData.title,
        cookingTime: editData.cookingTime,
        ingredients: editData.ingredients,
        instructions: editData.instructions,
      });
      // Refresh list or refetch
      setPage(1);  // or call getRecipes again
      handleEditClose();
    } catch (err) {
      setEditError(err.response?.data?.message || "Save failed");
    }
  };

  return (
    <>
      {/* Header */}
      <MKBox component="header" py={2} mb={4}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={2}>
            {/* Logo */}
            <Grid item xs={3}>
              {/* Logo */}
              <Box
                // display="flex"
                // justifyContent="center"
                // alignItems="center"
                // mb={3}            // space below the logo
              >
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/Logo.svg`}
                  alt="Site Logo"
                  sx={{ width: 200, height: 80 }}
                />
              </Box>
            </Grid>
            {/* Search Form */}
            <Grid item xs={5}>
              <form onSubmit={handleSearchSubmit}>
                <MKInput
                  fullWidth
                  placeholder="Search by title/ingredient..."
                  size="small"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSearchSubmit(e);
                  }}
                  icon={{ component: Icon, props: { children: "search" } }}
                />
              </form>
            </Grid>
            <Grid item xs={4} textAlign="right">
              <MKTypography
                    variant="button"
                    color="text"
                    sx={{ mr: 2, verticalAlign: "middle" }}
                  >
                    Welcome, {userName}
                  </MKTypography>
              {/* Menu */}
              <MKButton
                id="customized-button"
                aria-controls={menuOpen ? "customized-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : undefined}
                variant="contained"
                disableElevation
                onClick={handleMenuClick}
                endIcon={<KeyboardArrowDownIcon />}
              >
                Menu
              </MKButton>
              {/* Menu items */}
              <StyledMenu
                id="customized-menu"
                slotProps={{
                  list: { "aria-labelledby": "customized-button" },
                }}
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    switchToLogin();
                    handleOpen();
                  }}
                  disableRipple
                >
                  <EditIcon /> Register/Login
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/recipe/add");   // adjust path as needed
                  }}
                  disableRipple
                  disabled={!authTokenState}
                >
                  <FileCopyIcon /> Add Recipe
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleLogout();
                  }}
                  disableRipple
                  disabled={!authTokenState}
                >
                  <ArchiveIcon /> Logout
                </MenuItem>
              </StyledMenu>
            </Grid>
          </Grid>
        </Container>
      </MKBox>

      {/* Recipe Cards */}
      <MKBox component="main" py={6}>
        <Container maxWidth="lg">
          <MKTypography variant="h3" mb={4} textAlign="center">
            Recipe Collection
          </MKTypography>

          <Grid container spacing={4} direction="column">
            {recipes.map((r) => (
              <Grid item key={r.id} xs={12}>
                <Card sx={{ display: "flex", flexDirection: "column" }}>
                  <Grid container>
                    <Grid item xs={3}>
                      <CardMedia
                        component="img"
                        image={r.image}
                        alt={r.title}
                        sx={{
                          width: 200,
                          height: 200,
                          objectFit: "cover",
                        }}
                      />
                    </Grid>
                    <Grid item xs={9}>
                      <CardContent>
                        <MKTypography variant="h6" gutterBottom>
                          {r.title}
                        </MKTypography>
                        <MKTypography
                          variant="body2"
                          color="text"
                          mb={1}
                        >
                          by {r.author}
                        </MKTypography>
                        <MKTypography
                          variant="body2"
                          color="warning"
                        >
                          {r.rating}{" "}
                          <Icon
                            fontSize="small"
                            sx={{ verticalAlign: "middle" }}
                          >
                            star
                          </Icon>
                        </MKTypography>
                      </CardContent>

                      <CardActions
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          p: 2,
                        }}
                      >
                        {/* Always show View */}
                        <MKButton
                          fullWidth
                          color="info"
                          variant="contained"
                          onClick={() => navigate(`/recipe/${r.id}`)}
                        >
                          View
                        </MKButton>

                        {/* Only your own recipes get an active Edit button */}
                        {authTokenState && r.editable ? (
                          <MKButton
                            fullWidth
                            variant="contained"
                            color="info"
                            onClick={() =>
                              handleEditOpen(r)}
                          >
                            Edit
                          </MKButton>
                        ) : (
                          <MKButton
                            fullWidth
                            variant="outlined"
                            color="info"
                            disabled
                          >
                            Edit
                          </MKButton>
                        )}
                      </CardActions>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <MKBox mt={6} display="flex" justifyContent="center">
            <MKPagination>
              <MKPagination
                item
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Icon>keyboard_arrow_left</Icon>
              </MKPagination>

              {Array.from({ length: totalPages }, (_, i) => (
                <MKPagination
                  key={i + 1}
                  item
                  active={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </MKPagination>
              ))}

              <MKPagination
                item
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Icon>keyboard_arrow_right</Icon>
              </MKPagination>
            </MKPagination>
          </MKBox>
        </Container>
      </MKBox>

      {/* Login / Register Dialog */}
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="auth-dialog-title"
        open={open}
      >
        {/* Toggle Buttons */}
        <Grid item xs={12}>
          <DialogActions
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <MKButton
              fullWidth
              variant={mode === "login" ? "contained" : "outlined"}
              color="primary"
              onClick={switchToLogin}
            >
              Login
            </MKButton>
            <MKButton
              fullWidth
              variant={mode === "register" ? "contained" : "outlined"}
              color="secondary"
              onClick={switchToRegister}
            >
              Register
            </MKButton>
          </DialogActions>
        </Grid>

        <DialogContent dividers>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {mode === "login" && !successMessage && (
            <Box
              component="form"
              onSubmit={handleLoginSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 300,
                py: 1,
              }}
            >
              <MKInput
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
              />
              <MKInput
                name="password"
                label="Password"
                type="password"
                fullWidth
                required
              />
              <MKButton type="submit" fullWidth>
                Login
              </MKButton>
            </Box>
          )}

          {mode === "register" && !successMessage && (
            <Box
              component="form"
              onSubmit={handleRegisterSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 300,
                py: 1,
              }}
            >
              <MKInput
                name="name"
                label="Full Name"
                fullWidth
                required
              />
              <MKInput
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
              />
              <MKInput
                name="password"
                label="Password"
                type="password"
                fullWidth
                required
              />
              <MKButton type="submit" fullWidth>
                Register
              </MKButton>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </BootstrapDialog>

      {/*-----------------Edit Recipe Dialog--------------------------*/}
      <BootstrapDialog
        onClose={handleEditClose}
        aria-labelledby="edit-recipe-dialog"
        open={editOpen}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent dividers>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          {/* Image URL */}
          <MKInput
            name="image"
            label="Image URL"
            value={editData?.image || ""}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Title */}
          <MKInput
            name="title"
            label="Title"
            value={editData?.title || ""}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Cooking Time */}
          <MKInput
            name="cookingTime"
            label="Cooking Time (min)"
            type="number"
            value={editData?.cookingTime || ""}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Ingredients */}
          <MKTypography variant="h6" mb={1}>
            Ingredients
          </MKTypography>
          {editData?.ingredients.map((ing, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
              <Grid item xs={5}>
                <MKInput
                  placeholder="Name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <MKInput
                  placeholder="Amount"
                  value={ing.amount}
                  onChange={(e) => handleIngredientChange(idx, "amount", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <MKInput
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={1}>
                <MKButton
                  color="error"
                  size="small"
                  onClick={() => handleRemoveIngredient(idx)}
                >
                  ×
                </MKButton>
              </Grid>
            </Grid>
          ))}
          <MKButton onClick={handleAddIngredient} sx={{ mb: 2 }}>
            + Add Ingredient
          </MKButton>

          {/* Instructions */}
          <MKTypography variant="h6" mb={1}>
            Instructions
          </MKTypography>
          {editData?.instructions.map((step, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
              <Grid item xs>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder={`Step ${idx + 1}`}
                  value={step}
                  onChange={(e) => handleInstructionChange(idx, e.target.value)}
                />
              </Grid>
              <Grid item>
                <MKButton
                  color="error"
                  size="small"
                  onClick={() => handleRemoveInstruction(idx)}
                >
                  ×
                </MKButton>
              </Grid>
            </Grid>
          ))}
          <MKButton onClick={handleAddInstruction}>
            + Add Step
          </MKButton>
        </DialogContent>

        {/* Save / Cancel Buttons */}
        <DialogActions sx={{ p: 2 }}>
          <MKButton fullWidth onClick={handleEditSave}>
            Save
          </MKButton>
          <MKButton fullWidth color="secondary" onClick={handleEditClose}>
            Cancel
          </MKButton>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}
