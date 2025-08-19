// src/pages/HomePage.js

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";
import {
  Container, Grid, Card, CardMedia, TextField, CardContent, CardActions, Icon, Dialog, DialogTitle,DialogActions,
  DialogContent, Button, Box, Alert, Menu, MenuItem, Divider, Typography, CircularProgress, TablePagination
} from "@mui/material";
import { useSnackbar } from 'notistack';
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKInput from "components/MKInput";
import MKButton from "components/MKButton";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ArchiveIcon from "@mui/icons-material/Archive";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";


import { getMe, getRecipes, login, register, setAuthToken, updateRecipe, uploadAvatar } from "services/api";

const defaultEditData = {
  id: "",
  image: "",
  title: "",
  cookingTime: "",
  ingredients: [],
  instructions: []
};

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
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(defaultEditData);
  const [editError, setEditError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // full data set from server
  const [allRecipes, setAllRecipes] = useState([]);

  // text filter
  const [searchTerm, setSearchTerm] = useState("");

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  // auth + modal + user info
  const [authTokenState, setAuthTokenState] = useState("");
  const [userName, setUserName] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [successMessage, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  //image upload
  // const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  //initial load
  useEffect(() => {
  const token = sessionStorage.getItem("token");
  const user  = JSON.parse(sessionStorage.getItem("user") || "{}");

  if (!token) return;

  // 1) apply token to axios
  setAuthToken(token);

  // 2) flip “logged in” flag
  setAuthTokenState(token);

  // load name from storage
  if (user.name) {
    setUserName(user.name);
  } else {
    //fetch fresh
    getMe()
      .then(me => {
        sessionStorage.setItem("user", JSON.stringify(me));
        setUserName(me.name);
      })
      .catch(() => {
        setAuthToken(null);
        setAuthTokenState("");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      });
    }
  }, []);

  //autosearch after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      getRecipes({ title: searchTerm, ingredient: searchTerm })
        .then(({ recipes }) => {
          setAllRecipes(recipes);
          setPage(0); // reset when new search arrives
        })
        .catch(err => console.error("Fetch error:", err));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, authTokenState]);

  // filter by searchTerm tokens
  const filteredRecipes = useMemo(() => {
    const tokens = searchTerm.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return allRecipes;
    return allRecipes.filter(r =>
      tokens.every(tok =>
        r.title.toLowerCase().includes(tok.toLowerCase()) ||
        r.ingredients.some(i =>
          i.name.toLowerCase().includes(tok.toLowerCase())
        )
      )
    );
  }, [allRecipes, searchTerm]);

  // slice for current page
  const paginatedRecipes = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRecipes.slice(start, start + rowsPerPage);
  }, [filteredRecipes, page, rowsPerPage]);



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
  const showSuccessAndClose = (msg, callback, { shouldCloseDialog = true } = {}) => {
    setSuccess(msg);
    setTimeout(() => {
      if (shouldCloseDialog) {
        handleClose();
      } else {
        setSuccess("");
      }
      if (callback) {
        callback();
      }
    }, 1000);
  };
  const showError = (msg, callback) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage("");
      if (callback) callback();
    }, 1000);
  };

  const handleSaveClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
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

    // 2) persist token
    sessionStorage.setItem("token", token);
    setAuthToken(token);
    setAuthTokenState(token);

    // 3) fetch & persist user profile
    const me = await getMe();
    sessionStorage.setItem("user", JSON.stringify(me));
    sessionStorage.setItem("userId", me._id || me.id);

    setUserName(me.name || "");
    showSuccessAndClose("Login successful!");
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
        () => switchToLogin(),
        { shouldCloseDialog: false }
      );
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setAuthToken("");
    setAuthTokenState("");
    setUserName("");
    setPage(0);
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


  // Open dialog and seed state
  const handleEditOpen = (recipe) => {
    setEditData({ ...defaultEditData, ...recipe });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(defaultEditData);
    setEditError("");
  };

  // Update a top‐level field
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  //image save
  async function handleEditImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset any prior errors
    setUploadError("");

    // 1) Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    // 2) Validate file size (max 2 MB here, adjust as needed)
    const MAX = 2 * 1024 * 1024;
    if (file.size > MAX) {
      setUploadError("Image must be smaller than 2 MB.");
      return;
    }

    // 3) Show client‐side preview immediately
    const previewUrl = URL.createObjectURL(file);
    setEditData((d) => ({ ...d, image: previewUrl }));
    setIsUploading(true);

    // 4) Convert to Base64 data-URI
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUrl = reader.result; // "data:image/png;base64,AAA…"

      try {
        // 5) POST JSON { image: dataUrl } to /api/recipe/:id/avatar
        const { avatar } = await uploadAvatar(editData.id, dataUrl);

        // 6) Server echoes back the data-URI—persist it in state
        setEditData((d) => ({ ...d, image: avatar }));
      } catch (err) {
        console.error("Image upload failed:", err);
        setUploadError(
          err?.response?.data?.message ||
          err?.message ||
          "Image upload failed. Please try again."
        );
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(previewUrl);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadError("Failed to read the file. Please try a different image.");
    };
  }


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
    // 1) Push updates to the server
    await updateRecipe(editData.id, {
      image:        editData.image,
      title:        editData.title,
      cookingTime:  editData.cookingTime,
      ingredients:  editData.ingredients,
      instructions: editData.instructions,
    });

    // 2) Re-fetch the full list (with current searchTerm)
    const { recipes: freshList } = await getRecipes({
      title:      searchTerm,
      ingredient: searchTerm,
    });

    // 3) Overwrite your master array & reset page if needed
    setAllRecipes(freshList);
    setPage(0);

    // 4) Close the modal
    handleEditClose();
  } catch (err) {
    setEditError(err.response?.data?.message || "Save failed");
  }
};
  // Wrapper that shows toasts
  const handleConfirmSave = async () => {
    setConfirmOpen(false);
    try {
      await handleEditSave();
      enqueueSnackbar('Recipe saved successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || 'Failed to save recipe',
        { variant: 'error' }
      );
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
              <MKInput
                fullWidth
                placeholder="Search by title/ingredient..."
                size="small"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                icon={{ component: Icon, props: { children: "search" } }}
              />
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
      {paginatedRecipes.map((r) => (
        <Grid item key={r.id} xs={12}>
          <Card sx={{ display: "flex", flexDirection: "column" }}>
            <Grid container>
              <Grid item xs={3}>
                <CardMedia
                  component="img"
                  image={r.image}
                  alt={r.title}
                  sx={{ width: 200, height: 200, objectFit: "cover" }}
                />
              </Grid>
              <Grid item xs={9}>
                <CardContent>
                  <MKTypography variant="h6" gutterBottom>
                    {r.title}
                  </MKTypography>
                  <MKTypography variant="body2" color="text" mb={1}>
                    by {r.author}
                  </MKTypography>
                  <MKTypography variant="body2" color="warning">
                    {r.rating}{" "}
                    <Icon fontSize="small" sx={{ verticalAlign: "middle" }}>
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
                  <MKButton
                    fullWidth
                    color="info"
                    variant="contained"
                    onClick={() => navigate(`/recipe/${r.id}`)}
                  >
                    View
                  </MKButton>

                  {authTokenState && r.editable ? (
                    <MKButton
                      fullWidth
                      variant="contained"
                      color="info"
                      onClick={() => handleEditOpen(r)}
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
      <TablePagination
        component="div"
        count={filteredRecipes.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[2, 3, 4]}
        labelRowsPerPage="Recipes per page:"
        showFirstButton
        showLastButton
      />
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

          {/* Image Upload */}
          <Box textAlign="center" sx={{ mb: 2 }}>
            {/* Preview */}
            {editData.image && (
              <CardMedia
                component="img"
                image={editData.image}
                alt="Preview"
                sx={{
                  width: 200,
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 1,
                  mx: "auto",
                  mb: 1,
                }}
              />
            )}

            {/* Hidden file input */}
            <input
              accept="image/*"
              type="file"
              id="edit-recipe-image-upload"
              style={{ display: "none" }}
              onChange={handleEditImageChange}
            />

            {/* Upload button */}
            <label htmlFor="edit-recipe-image-upload">
              <MKButton
                component="span"
                disabled={isUploading}
                sx={{ position: "relative" }}
              >
                {isUploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Change Image"
                )}
              </MKButton>
            </label>

            {/* Error message */}
            {uploadError && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 1 }}
              >
                {uploadError}
              </Typography>
            )}
          </Box>

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
                  x``
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
          <MKButton fullWidth onClick={handleSaveClick}>
            Save
          </MKButton>
          <MKButton fullWidth color="secondary" onClick={handleEditClose}>
            Cancel
          </MKButton>
        </DialogActions>
      </BootstrapDialog>
            {/*-----------------Confirm Save Dialog--------------------------*/}
      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">Confirm</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to save changes to this recipe?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button color="primary" onClick={handleConfirmSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}