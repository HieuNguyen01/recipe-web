// src/pages/RecipePage.js
import React, { useState, useEffect }      from "react";
import { useParams, useNavigate }          from "react-router-dom";
import {
  Container,
  Grid,
  CardMedia,
  CardContent,
  CardActions,
  Icon,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import { styled }                          from "@mui/material/styles";
import MKBox                               from "components/MKBox";
import MKTypography                        from "components/MKTypography";
import MKButton                            from "components/MKButton";
import MKInput                             from "components/MKInput";
import {
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  commentRecipe
} from "services/api";

const RecipeCard = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  boxShadow: theme.shadows[3],
}));

// Editable wrapper: toggles between view & edit modes
function EditableField({ label, value, editMode, onChange, multiline }) {
  return (
    <Box mb={2}>
      <MKTypography variant="button" fontWeight="medium" gutterBottom>
        {label}
      </MKTypography>
      {editMode ? (
        multiline ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            name={label.toLowerCase()}
            value={value}
            onChange={onChange}
            variant="outlined"
          />
        ) : (
          <MKInput
            fullWidth
            name={label.toLowerCase()}
            value={value}
            onChange={onChange}
          />
        )
      ) : (
        <MKTypography variant="body2" color="text">
          {value}
        </MKTypography>
      )}
    </Box>
  );
}

export default function RecipePage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [recipe, setRecipe]         = useState(null);
  const [draft, setDraft]           = useState({});
  const [editMode, setEditMode]     = useState(false);
  const [authToken, setAuthToken]   = useState("");
  const [userId, setUserId]         = useState("");
  const [commentDialog, setCommentDialog] = useState(false);
  const [newComment, setNewComment]       = useState("");

  // Load auth data
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user  = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (token) {
      setAuthToken(token);
      setUserId(user.id);
    }
  }, []);

  // Fetch recipe
  useEffect(() => {
    getRecipeById(id)
      .then((data) => {
        setRecipe(data);
        setDraft(data);
      })
      .catch(console.error);
  }, [id]);

  if (!recipe) return <MKTypography>Loading...</MKTypography>;

  const isOwner  = authToken && recipe.authorId === userId;
  const isAuthed  = Boolean(authToken);

  // Handlers
  function handleFieldChange(e) {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function handleSave() {
    updateRecipe(id, draft)
      .then((updated) => {
        setRecipe(updated);
        setDraft(updated);
        setEditMode(false);
      })
      .catch(console.error);
  }

  function handleCancel() {
    setDraft(recipe);
    setEditMode(false);
  }

  function handleDelete() {
    if (window.confirm("Delete this recipe?")) {
      deleteRecipe(id).then(() => navigate("/recipes"));
    }
  }

  function handleLike() {
    likeRecipe(id)
      .then((res) => setRecipe((r) => ({ ...r, likeCount: res.likeCount })))
      .catch(console.error);
  }

  function openComment() {
    setCommentDialog(true);
  }

  function closeComment() {
    setCommentDialog(false);
    setNewComment("");
  }

  function submitComment() {
    if (!newComment.trim()) return;
    commentRecipe(id, newComment)
      .then((res) => {
        setRecipe((r) => ({ ...r, comments: res.comments }));
        closeComment();
      })
      .catch(console.error);
  }

  return (
    <MKBox component="main" py={6}>
      <Container maxWidth="md">
        {/* Recipe Card */}
        <RecipeCard>
          <Grid container>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <MKInput
                  fullWidth
                  name="image"
                  value={draft.image}
                  onChange={handleFieldChange}
                />
              ) : (
                <CardMedia
                  component="img"
                  image={recipe.image}
                  alt={recipe.title}
                  sx={{ height: "100%", objectFit: "cover" }}
                />
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <CardContent>
                <EditableField
                  label="Title"
                  value={draft.title}
                  editMode={editMode}
                  onChange={handleFieldChange}
                />
                <EditableField
                  label="Author"
                  value={draft.author}
                  editMode={editMode}
                  onChange={handleFieldChange}
                />

                <Box display="flex" alignItems="center" mt={1} mb={2}>
                  <MKTypography variant="body2" color="warning" mr={1}>
                    {recipe.averageRating.toFixed(1)}
                  </MKTypography>
                  <Icon fontSize="small" color="warning">
                    star
                  </Icon>
                  <Box ml="auto" display="flex" gap={1}>
                    <MKButton
                      size="small"
                      disabled={!isAuthed}
                      onClick={handleLike}
                    >
                      Like {recipe.likeCount}
                    </MKButton>
                    <MKButton
                      size="small"
                      disabled={!isAuthed}
                      onClick={openComment}
                    >
                      Comment {recipe.comments.length}
                    </MKButton>
                    {isOwner && !editMode && (
                      <>
                        <MKButton
                          size="small"
                          color="dark"
                          variant="outlined"
                          onClick={() => setEditMode(true)}
                        >
                          Edit
                        </MKButton>
                        <MKButton
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={handleDelete}
                        >
                          Delete
                        </MKButton>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
              {editMode && (
                <CardActions sx={{ p: 2, gap: 2 }}>
                  <MKButton color="success" onClick={handleSave}>
                    Save
                  </MKButton>
                  <MKButton color="secondary" onClick={handleCancel}>
                    Cancel
                  </MKButton>
                </CardActions>
              )}
            </Grid>
          </Grid>
        </RecipeCard>

        {/* Divider */}
        <Box my={4}>
          <Divider />
        </Box>

        {/* Ingredients */}
        <Box mb={4}>
          <MKTypography variant="h5" mb={2}>
            Ingredients
          </MKTypography>
          <List>
            {draft.ingredients.map((ing, idx) => (
              <ListItem key={idx} disableGutters>
                {editMode ? (
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <MKInput
                        name="amount"
                        value={ing.amount}
                        onChange={(e) => {
                          const newList = [...draft.ingredients];
                          newList[idx].amount = e.target.value;
                          setDraft((d) => ({ ...d, ingredients: newList }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <MKInput
                        name="unit"
                        value={ing.unit}
                        onChange={(e) => {
                          const newList = [...draft.ingredients];
                          newList[idx].unit = e.target.value;
                          setDraft((d) => ({ ...d, ingredients: newList }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={5}>
                      <MKInput
                        name="name"
                        value={ing.name}
                        onChange={(e) => {
                          const newList = [...draft.ingredients];
                          newList[idx].name = e.target.value;
                          setDraft((d) => ({ ...d, ingredients: newList }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <MKButton
                        color="error"
                        size="small"
                        onClick={() => {
                          const newList = draft.ingredients.filter(
                            (_, i) => i !== idx
                          );
                          setDraft((d) => ({ ...d, ingredients: newList }));
                        }}
                      >
                        ×
                      </MKButton>
                    </Grid>
                  </Grid>
                ) : (
                  <ListItemText
                    primary={`${ing.amount} ${ing.unit} — ${ing.name}`}
                  />
                )}
              </ListItem>
            ))}
            {editMode && (
              <MKButton
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    ingredients: [
                      ...d.ingredients,
                      { amount: "", unit: "", name: "" },
                    ],
                  }))
                }
              >
                + Add Ingredient
              </MKButton>
            )}
          </List>
        </Box>

        {/* Instructions */}
        <Box mb={4}>
          <MKTypography variant="h5" mb={2}>
            Instructions
          </MKTypography>
          <Box component="ol" pl={2}>
            {draft.instructions.map((step, idx) => (
              <Box component="li" key={idx} mb={1}>
                {editMode ? (
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs>
                      <TextField
                        fullWidth
                        value={step}
                        onChange={(e) => {
                          const newInst = [...draft.instructions];
                          newInst[idx] = e.target.value;
                          setDraft((d) => ({ ...d, instructions: newInst }));
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <MKButton
                        color="error"
                        size="small"
                        onClick={() => {
                          const newInst = draft.instructions.filter(
                            (_, i) => i !== idx
                          );
                          setDraft((d) => ({ ...d, instructions: newInst }));
                        }}
                      >
                        ×
                      </MKButton>
                    </Grid>
                  </Grid>
                ) : (
                  <MKTypography variant="body2">{step}</MKTypography>
                )}
              </Box>
            ))}
            {editMode && (
              <MKButton
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    instructions: [...d.instructions, ""],
                  }))
                }
              >
                + Add Step
              </MKButton>
            )}
          </Box>
        </Box>
      </Container>

      {/* Comment Dialog */}
      <Dialog open={commentDialog} onClose={closeComment}>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Your Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MKButton onClick={submitComment}>Submit</MKButton>
          <MKButton color="secondary" onClick={closeComment}>
            Cancel
          </MKButton>
        </DialogActions>
      </Dialog>
    </MKBox>
  );
}
