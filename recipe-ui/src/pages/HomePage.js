// src/pages/HomePage.js

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Icon,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Box,
  Alert,
} from "@mui/material";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKInput from "components/MKInput";
import MKButton from "components/MKButton";
import MKPagination from "components/MKPagination";

import { getMe, getRecipes, login, register, setAuthToken } from "services/api";

// Styled Dialog for consistent padding
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // fetch recipes whenever page changes
  // useEffect(() => {
  //   getRecipes({ page, limit })
  //     .then(({ recipes: data, pagination }) => {
  //       setRecipes(data);
  //       setTotal(pagination.totalPages);
  //     })
  //     .catch(console.error);
  // }, [page]);

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
      setUserName(user.name || "");

      showSuccessAndClose("Login successful!", () => navigate(0));
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
  };

  return (
    <>
      {/* Header */}
      <MKBox component="header" py={2} mb={4}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={2}>
            {/* Logo */}
            <Grid item xs={2}>
              <MKTypography variant="h4" fontWeight="bold">
                MyRecipes
              </MKTypography>
            </Grid>
            {/* Search Form */}
            <Grid item xs={6}>
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
            {/* Login / Logout */}
            <Grid item xs={4} textAlign="right">
              {authTokenState ? (
                <>
                  <MKTypography
                    variant="button"
                    color="text"
                    sx={{ mr: 2, verticalAlign: "middle" }}
                  >
                    Welcome, {userName}
                  </MKTypography>
                  <MKButton
                    variant="gradient"
                    color="error"
                    onClick={handleLogout}
                  >
                    Logout
                  </MKButton>
                </>
              ) : (
                <MKButton
                  variant="gradient"
                  color="info"
                  onClick={handleOpen}
                >
                  Login
                </MKButton>
              )}
            </Grid>
          </Grid>
        </Container>
      </MKBox>

      {/* Recipe Cards */}
      <MKBox component="main" py={6}>
        <Container maxWidth="lg">
          <MKTypography variant="h3" mb={4}>
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
                          color="secondary"
                          onClick={() => navigate(`/recipe/${r.id}`)}
                        >
                          View
                        </MKButton>

                        {/* Only your own recipes get an active Edit button */}
                        {authTokenState && r.editable ? (
                          <MKButton
                            fullWidth
                            variant="outlined"
                            color="primary"
                            onClick={() =>
                              navigate(`/recipe/${r._id}/edit`)
                            }
                          >
                            Edit
                          </MKButton>
                        ) : (
                          <MKButton
                            fullWidth
                            variant="outlined"
                            color="primary"
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
    </>
  );
}
