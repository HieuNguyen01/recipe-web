import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "services/contexts/authContext";
import { useLoading } from "services/contexts/loadingContext";
import { useNavigate } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";
import { Container,Grid,Card,CardMedia,TextField,CardContent,CardActions,Icon,
  Dialog,DialogActions,DialogContent,Button,Box,Alert,Menu,MenuItem,Divider,
  Typography,CircularProgress,TablePagination,Chip,Stack} 
  from "@mui/material";
import { useSnackbar } from "notistack";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKInput from "components/MKInput";
import MKButton from "components/MKButton";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ArchiveIcon from "@mui/icons-material/Archive";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import useConfirmDialog from "ui/hooks/useConfirmDialog";
// import { BorderColorOutlined, Opacity } from "@mui/icons-material";

// API calls
// import {  register, updateRecipe } from "services/api";
import { login as loginAPI, register } from "../services/api/auth";
import { getRecipes, updateRecipe, getRecipeById } from "../services/api/recipes";
import { uploadRecipeImage, getRecipeImageDataUri } from "../services/api/images";
import { fileToDataUrl } from "../services/helpers/fileToDataUrl";
import { hydrateImages } from "../services/helpers/hydrateImage";

const defaultEditData = {
  id: "",
  image: "",
  title: "",
  cookingTime: "",
  ingredients: [],
  instructions: [],
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
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
    ...theme.applyStyles("dark", {
      color: theme.palette.grey[300],
    }),
  },
}));

export default function HomePage() {
  const navigate = useNavigate();
  const { inc, dec } = useLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { openConfirm, ConfirmDialogRender } = useConfirmDialog();

  // recipes list error state
  const [fetchError, setFetchError] = useState("");

  // Edit recipe dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(defaultEditData);
  const [editError, setEditError] = useState("");

  // full recipes list from server
  const [allRecipes, setAllRecipes] = useState([]);

  // search + pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // authContext
  const { user, token, login, logout } = useAuth();
  const isAuthed = Boolean(token);

  // Login/Register
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [successMessage, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  //loading for dialog, image
  // const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  //new image setup
  const [committedImage, setCommittedImage] = useState("");
  const [draftImageFile, setDraftImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // autosearch after user stops typing
  useEffect(() => {
    let mounted = true;
    setFetchError("");
    inc();

    const timer = setTimeout(async () => {
      try {
        const recipes = await getRecipes({
          title: searchTerm,
          ingredient: searchTerm,
        });

        // For each recipe with a filename, fetch its Base64 URI
        const recipesWithUri = await Promise.all(
          recipes.map(async (r) => {
            if (r.image && !r.image.startsWith("data:")) {
              try {
                const { image: dataUri } = await getRecipeImageDataUri(r.id);
                return { ...r, image: dataUri };
              } catch {
                // if GET fails, just return original filename
                return r;
              }
            }
            return r;
          })
        );

        if (!mounted) return;
        setAllRecipes(recipesWithUri);
        setPage(0);
      } catch (err) {
        const msg = err.response?.data?.message || "Unable to load recipes";
        setFetchError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        setAllRecipes([]);
      } finally {
        dec();
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      dec();
    };
  }, [searchTerm, token, enqueueSnackbar, inc, dec]);

  //image-sync
  useEffect(() => {
    let mounted = true;

    // reset state
    setCommittedImage(editData.image || "");
    setDraftImageFile(null);
    setImagePreview("");
    setIsDialogLoading(true);
    setEditError("");

    // no image → done
    if (!editData.image) {
      setIsDialogLoading(false);
      return;
    }

    // already a data URI → use it directly
    if (editData.image.startsWith("data:")) {
      setImagePreview(editData.image);
      setIsDialogLoading(false);
      return;
    }

    // otherwise fetch its Base64 URI
    getRecipeImageDataUri(editData.id)
      .then(({ image }) => {
        if (mounted) setImagePreview(image);
      })
      .catch(() => {
        // silent fail: leave imagePreview as empty or filename
      })
      .finally(() => {
        if (mounted) setIsDialogLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [editData.id, editData.image]);

  // filter + pagination
  const filteredRecipes = useMemo(() => {
    const tokens = searchTerm.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return allRecipes;
    return allRecipes.filter((r) =>
      tokens.every(
        (tok) =>
          r.title.toLowerCase().includes(tok.toLowerCase()) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(tok.toLowerCase()))
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

  // LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      const { token: newToken, user: authUser } = await loginAPI({ email, password });
      login({ token: newToken, user: authUser });
      setSuccess("Login successful!");
      setErrorMessage("");
      setTimeout(handleClose, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: "error" });
      setTimeout(() => setErrorMessage(""), 1000);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // REGISTER
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    // client‐side check
    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: "error" });
      setTimeout(() => setErrorMessage(""), 2000);
      setIsAuthLoading(false);
      return;
    }

    try {
      await register({ name, email, password, confirmPassword });
      setSuccess("Registration successful! Please log in.");
      setErrorMessage("");
      setMode("login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrorMessage(msg);
      enqueueSnackbar(msg, { variant: "error" });
      setTimeout(() => setErrorMessage(""), 2000);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    logout();
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
    setEditError("");
    setIsDialogLoading(true);
    setEditOpen(true);
    setEditData({ ...defaultEditData, ...recipe });
  };


  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(defaultEditData);
    setEditError("");
  };

  // Update a top‐level field
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: name === "cookingTime" ? value : value,
    }));
  };

  //image save
  async function handleEditImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate type & size...
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        enqueueSnackbar("Select a valid image under 2 MB", { variant: "error"});      
        return;
    }

    // generate local preview
    const objectUrl = URL.createObjectURL(file);
    setDraftImageFile(file);
    setImagePreview(objectUrl);
    enqueueSnackbar("Image selected and previewed", {
      variant: "success",
    });

    // clear any previous errors
    // setUploadError("");
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
    setIsSaving(true);
    setEditError("");

    try {
      // 1) Commit draft image (if any)
      if (draftImageFile) {
        // a) file → base64 Data-URI
        const dataUrl = await fileToDataUrl(draftImageFile);

        // b) POST to server
        await uploadRecipeImage(editData.id, dataUrl);

        // c) GET back the saved Data-URI
        const { image: savedDataUri } = await getRecipeImageDataUri(editData.id);

        // d) Update committed state & dialog
        setCommittedImage(savedDataUri);
        setEditData((d) => ({ ...d, image: savedDataUri }));

        // e) Propagate to main list
        setAllRecipes((prev) =>
          prev.map((r) => (r.id === editData.id ? { ...r, image: savedDataUri } : r))
        );

        // f) Clear draft and blob preview
        URL.revokeObjectURL(imagePreview);
        setImagePreview(savedDataUri);
        setDraftImageFile(null);
      }

      // 2) Push text/other edits
      await updateRecipe(editData.id, {
        title: editData.title,
        description: editData.description,
        cookingTime: editData.cookingTime,
        ingredients: editData.ingredients,
        instructions: editData.instructions,
        // note: image field now handled above
      });

      // 3) Refresh full list & hydrate images
      const freshList = await getRecipes({
        title: searchTerm,
        ingredient: searchTerm,
      });
      const hydrated = await hydrateImages(freshList);
      setAllRecipes(hydrated);
      setPage(0);

      // 4) Close dialog
      handleEditClose();
    } catch (err) {
      setEditError(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };


  const handleConfirmSave = async () => {
    try {
      await handleEditSave();
      enqueueSnackbar("Recipe saved successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to save recipe", { variant: "error" });
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
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={{ component: Icon, props: { children: "search" } }}
              />
            </Grid>
            <Grid item xs={4} textAlign="right">
              {isAuthed && (
                <MKTypography variant="button" color="text" sx={{ mr: 2, verticalAlign: "middle" }}>
                  Welcome, {user.name}
                </MKTypography>
              )}
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
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                slotProps={{ list: { "aria-labelledby": "customized-button" } }}
              >
                {!isAuthed && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      switchToLogin();
                      handleOpen();
                    }}
                    disableRipple
                  >
                    <EditIcon /> Register / Login
                  </MenuItem>
                )}

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/recipe/add");
                  }}
                  disableRipple
                  disabled={!isAuthed}
                >
                  <FileCopyIcon /> Add Recipe
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                {isAuthed && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      handleLogout();
                    }}
                    disableRipple
                  >
                    <ArchiveIcon /> Logout
                  </MenuItem>
                )}
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

          {/* Fetch error */}
          {fetchError && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {fetchError}
            </Alert>
          )}

          {/* Empty‐state when no recipes */}
          {!fetchError && paginatedRecipes.length === 0 && (
            <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
              {searchTerm
                ? `No recipes match “${searchTerm}”.`
                : "No recipes available at the moment."}
            </Typography>
          )}

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
                        sx={{ width: 200, height: 200, objectFit: "cover",margin: 1 }}
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

                        {isAuthed && r.editable ? (
                          <MKButton
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => handleEditOpen(r)}
                          >
                            Edit
                          </MKButton>
                        ) : (
                          <MKButton fullWidth variant="outlined" color="secondary" disabled>
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
          {paginatedRecipes.length > 0 && (
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
          )}
        </Container>
      </MKBox>

      {/* Login / Register Dialog */}
      <BootstrapDialog onClose={handleClose} aria-labelledby="auth-dialog-title" open={open}>
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
              disabled={isAuthLoading}
              onClick={switchToLogin}
            >
              Login
            </MKButton>
            <MKButton
              fullWidth
              variant={mode === "register" ? "contained" : "outlined"}
              color="secondary"
              disabled={isAuthLoading}
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

          {mode === "login" && (
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
                disabled={isAuthLoading}
              />
              <MKInput
                name="password"
                label="Password"
                type="password"
                fullWidth
                required
                disabled={isAuthLoading}
              />
              <MKButton type="submit" fullWidth color="primary" disabled={isAuthLoading}>
                {isAuthLoading ? <CircularProgress size={20} color="inherit" /> : "Login"}
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
              <MKInput name="name" label="Full Name" fullWidth required disabled={isAuthLoading} />
              <MKInput
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
                disabled={isAuthLoading}
              />
              <MKInput
                name="password"
                label="Password"
                type="password"
                fullWidth
                required
                disabled={isAuthLoading}
              />
              <MKInput
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                fullWidth
                required
                disabled={isAuthLoading}
              />
              <MKButton type="submit" fullWidth color="secondary" disabled={isAuthLoading}>
                {isAuthLoading ? <CircularProgress size={20} color="inherit" /> : "Register"}
              </MKButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose} disabled={isAuthLoading}>
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
          {isDialogLoading ? (
            <Box textAlign="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <fieldset
              disabled={isUploading || isSaving}
              aria-busy={isUploading || isSaving}
              style={{ border: 0 }}
            >
              {editError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {editError}
                </Alert>
              )}

              {/* Image Upload */}
              <Box component={Stack} alignItems="center" spacing={1} sx={{ mb: 2 }}>
                {/* Preview container */}
                {imagePreview && (
                  <Box
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    {/* “Preview” badge when it’s a draft */}
                    {draftImageFile && (
                      <Chip
                        label="Preview"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          bgcolor: "background.paper",
                          fontWeight: 500,
                          zIndex: 1,
                        }}
                      />
                    )}

                    <CardMedia
                      component="img"
                      image={imagePreview}
                      alt="Recipe preview"
                      sx={{
                        width: 200,
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 1,
                        margin: 1
                      }}
                    />
                  </Box>
                )}

                {/* Hidden file input + Change Image button */}
                <input
                  accept="image/*"
                  type="file"
                  id="edit-recipe-image-upload"
                  style={{ display: "none" }}
                  onChange={handleEditImageChange}
                />
                <label htmlFor="edit-recipe-image-upload">
                  <MKButton
                    color="info"
                    component="span"
                    disabled={isUploading}
                    sx={{ minWidth: 140 }}
                  >
                    {isUploading ? <CircularProgress size={20} color="inherit" /> : "Change Image"}
                  </MKButton>
                </label>
              </Box>

              {/* Title */}
              <MKInput
                name="title"
                label="Title"
                value={editData.title || ""}
                onChange={handleEditChange}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* Description */}
              <MKInput
                name="description"
                label="Description"
                value={editData.description || ""}
                onChange={handleEditChange}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* Cooking Time */}
              <MKInput
                name="cookingTime"
                label="Cooking Time (min)"
                type="number"
                value={editData.cookingTime}
                onChange={handleEditChange}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* Ingredients */}
              <MKTypography variant="h6" mb={1}>
                Ingredients
              </MKTypography>
              {editData.ingredients.map((ing, idx) => (
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
                  <Grid item xs={2}>
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
                      x
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
              {editData.instructions.map((step, idx) => (
                <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
                  <Grid item xs={10}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder={`Step ${idx + 1}`}
                      value={step}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <MKButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveInstruction(idx)}
                    >
                      x
                    </MKButton>
                  </Grid>
                </Grid>
              ))}
              <MKButton onClick={handleAddInstruction}>+ Add Step</MKButton>
            </fieldset>
          )}
        </DialogContent>

        {/* Save / Cancel Buttons */}
        <DialogActions sx={{ p: 2 }}>
          <MKButton
            fullWidth
            color="success"
            disabled={isUploading || isSaving}
            sx={{ position: "relative" }}
            onClick={() =>
              openConfirm({
                title: "Confirm Edit",
                contentText: "Are you sure you want to save changes to this recipe?",
                confirmText: "Save",
                cancelText: "Cancel",
                confirmButtonProps: {
                  variant: "contained",
                  sx: {
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    borderColor: "#4caf50",
                    "&:hover": {
                      opacity: 0.8,
                      backgroundColor: "#4caf50",
                      borderColor: "#4caf50",
                      color: "#fff",
                    },
                  },
                },
                cancelButtonProps: {
                  variant: "outlined",
                  sx: {
                    backgroundColor: "#fff",
                    color: "#7b809a",
                    borderColor: "#7b809a",
                    "&:hover": {
                      opacity: 0.8,
                      backgroundColor: "#7b809a",
                      borderColor: "#7b809a",
                      color: "#fff",
                    },
                  },
                },
                onConfirm: handleConfirmSave,
              })
            }
          >
            {isSaving ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </MKButton>

          <MKButton
            onClick={handleEditClose}
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{
              "&:hover": {
                backgroundColor: "#7b809a",
                borderColor: "#7b809a",
                color: "#fff",
              },
            }}
          >
            Cancel
          </MKButton>
        </DialogActions>
      </BootstrapDialog>
      {/* ─── Confirm Edit Dialog ─── */}
      <ConfirmDialogRender />
    </>
  );
}
