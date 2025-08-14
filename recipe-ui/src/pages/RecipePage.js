// src/pages/RecipePage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Grid, Card, CardMedia, CardContent, CardActions, Icon, Divider, Box,
    Dialog, DialogContent, DialogActions, TextField, Link,Typography, Breadcrumbs, CircularProgress} from "@mui/material";
import { styled } from "@mui/material/styles";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";
import MKInput from "components/MKInput";
import { getRecipeById, updateRecipe, deleteRecipe, likeRecipe, commentRecipe, uploadAvatar} from "services/api";

//RecipeCard
const RecipeCard = styled(Card)(({ theme }) => ({
    maxWidth: 800,
    margin: "0 auto",
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
                        minRows={2}
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
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState({
  _id:          id, 
  title:        "",
  description:  "",
  cookingTime:  0,
  ingredients:  [],
  instructions: [],
  comments:     [],
  likeCount:    0,
  liked:        false,
  authorId:     { _id: "", name: "" },
  // …any other fields you render…
});
    const [draft, setDraft] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [authToken, setAuthToken] = useState("");
    const [userId, setUserId] = useState("");
    const [commentDialog, setCommentDialog] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Load auth data
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const id = sessionStorage.getItem('userId');

        if (token && id) {
            setAuthToken(token);
            setUserId(id);
        }
    }, []);


    // Fetch recipe
useEffect(() => {
  getRecipeById(id)
    .then((data) => {
      setRecipe(prev => ({
        ...prev,
        ...data,
        // fallback to existing if server didn’t send them
        comments:     data.comments     ?? prev.comments,
        likeCount:    data.likeCount    ?? prev.likeCount,
        liked:        data.liked        ?? prev.liked,
        ingredients:  data.ingredients  ?? prev.ingredients,
        instructions: data.instructions ?? prev.instructions
      }));
      setDraft({
        ...data,
        author: data.authorId?.name || ""
      });
    })
    .catch(console.error);
}, [id]);


    if (!recipe) return <MKTypography>Loading...</MKTypography>;

    const rawAuthorId = typeof recipe.authorId === 'string' ? recipe.authorId
    : recipe.authorId?._id?.toString();

    console.log({ rawAuthorId, userId, authToken });

    const isOwner = authToken && rawAuthorId === userId;
    const isAuthed = Boolean(authToken);

    // Handlers
    function handleFieldChange(e) {
        const { name, value } = e.target;
        setDraft((d) => ({ ...d, [name]: value }));
    }

  async function handleSave() {
    setIsSaving(true);
    setSaveError("");

    try {
      await updateRecipe(id, draft);
      const fullRecipe = await getRecipeById(id);
      setRecipe(fullRecipe);
      setDraft({
        ...fullRecipe,
        author: fullRecipe.authorId.name
      });
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setSaveError("Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

async function handleImageChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  // reset previous errors
  setUploadError("");

  // 1) Validate file type
  if (!file.type.startsWith("image/")) {
    setUploadError("Please select a valid image file.");
    return;
  }

  // 2) Validate file size (max 5MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    setUploadError("Image must be smaller than 5 MB.");
    return;
  }

  // 3) Show local preview immediately
  const previewUrl = URL.createObjectURL(file);
  setDraft(d => ({ ...d, image: previewUrl }));
  setIsUploading(true);

  // 4) Convert to Data URI & upload
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    try {
      const dataUrl = reader.result; // e.g. "data:image/png;base64,…"
      const { avatar } = await uploadAvatar(recipe._id, dataUrl);

      // server echoes back the same Data URI
      setDraft(d => ({ ...d, image: avatar }));
    } catch (err) {
      console.error("Upload failed", err);
      setUploadError(err.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };
}


    // function handleCancel() {
    //     setDraft(recipe);
    //     setEditMode(false);
    // }

  function handleDelete() {
    if (window.confirm("Delete this recipe?")) {
      deleteRecipe(id).then(() => {
        // clear any search-params if needed
        navigate("/", { replace: true });
      });
    }
  }

  async function handleLike() {
    console.log("▶️ sending POST to /like for id:", id);
    try {
      const { liked, likeCount } = await likeRecipe(id);
      console.log("◀️ got response:", { liked, likeCount });
      setRecipe(prev => ({ ...prev, liked, likeCount }));
    } catch (err) {
      console.error("⚠️ likeRecipe error:", err.response?.status, err.message);
    }
  }

    function openComment() {
        setCommentDialog(true);
    }

    function closeComment() {
        setCommentDialog(false);
        setNewComment("");
    }

  async function submitComment() {
    if (!newComment.trim()) return;
    try {
      const res = await commentRecipe(id, newComment);
      const created = res.data.data;

      // merge into state, keeping newest first
      setRecipe(r => ({
        ...r,
        comments: [created, ...(r.comments || [])]
      }));

      closeComment();
    } catch (err) {
      console.error("Submit error:", err);
      // showError(getErrorMessage(err.response?.status));
    }
  }

    return (
    <MKBox component="main" py={6}>
      <Container maxWidth="md">
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
        <RecipeCard elevation={3}>
          {/* Row 1: Image (md4) & Title (md8) */}
          <Grid container alignItems="center" justifyContent="center" spacing={2} p={2}>
            <Grid item xs={12} md={4}>
                {editMode ? (
                  <Box textAlign="center">
                    {/* Live preview */}
                    {draft.image && (
                      <CardMedia
                        component="img"
                        image={draft.image}
                        alt="Preview"
                        sx={{
                          width: 200,
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 1,
                          mx: "auto",
                          mb: 2,
                        }}
                      />
                    )}

                    {/* Hidden file input */}
                    <input
                      accept="image/*"
                      type="file"
                      id="recipe-image-upload"
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />

                    {/* Upload button with spinner */}
                    <label htmlFor="recipe-image-upload">
                      <MKButton
                        component="span"
                        disabled={isUploading}
                        sx={{ position: "relative" }}
                      >
                        {isUploading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Upload Image"
                        )}
                      </MKButton>
                    </label>

                    {/* Validation / upload error message */}
                    {uploadError && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {uploadError}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <CardMedia
                    component="img"
                    image={recipe.image}
                    alt={recipe.title}
                    sx={{
                      width: 200,
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 1,
                      mx: "auto",
                    }}
                  />
                )}
            </Grid>

            <Grid item xs={12} md={8}>
              {editMode ? (
                <MKInput
                  fullWidth
                  name="title"
                  value={draft.title}
                  onChange={handleFieldChange}
                  placeholder="Recipe Title"
                />
              ) : (
                <MKTypography variant="h5" align="center">
                  {recipe.title}
                </MKTypography>
              )}
            </Grid>
          </Grid>

          {/* Row 2: Author */}
          <Grid container alignItems="center" spacing={2} p={2}>
            <Grid item xs={12}>
                <Box display="flex" alignItems="center">
                  <MKTypography variant="button" mr={1}>
                    Author:
                  </MKTypography>
                  <MKTypography variant="body1">
                      {recipe.authorId?.name || recipe.author?.name || '—'}
                  </MKTypography>
                </Box>
            </Grid>
          </Grid>

          {/* Row 3: Rating & CookingTime */}
          <Grid container alignItems="center" spacing={2} p={2}>
            <Grid item>
              <Box display="flex" alignItems="center">
                <Icon color="warning" sx={{ ml: 0.5, verticalAlign: "middle" }}>
                    star
                </Icon>
                <MKTypography variant="body2" color="warning" display="inline">
                    {(recipe.averageRating ?? 0).toFixed(1)}
                </MKTypography>
              </Box>
            </Grid>
            <Grid item>
                {editMode ? (
                    <Box display="flex" alignItems="center">
                        <Icon fontSize="small" sx={{ verticalAlign: "middle" }}>
                            schedule
                        </Icon>
                        <MKInput
                            name="cookingTime"
                            value={draft.cookingTime}
                            onChange={handleFieldChange}
                            placeholder=""
                        />
                    </Box>) : (
                    <Box display="flex" alignItems="center">
                        <Icon fontSize="small" sx={{ verticalAlign: "middle" }}>
                            schedule
                        </Icon>
                        <MKTypography
                            variant="body2"
                            display="inline"
                            sx={{ ml: 0.5 }}
                        >
                            {recipe.cookingTime} min
                        </MKTypography>
                    </Box>
                )}
            </Grid>
            <Grid item xs />
        </Grid>

        <Divider />

          {/* Body: Ingredients */}
<CardContent>
  <MKTypography variant="h5" gutterBottom>
    Ingredients
  </MKTypography>

  {editMode ? (
    <>
      {draft.ingredients.map((ing, idx) => (
        <Grid
          container
          spacing={1}
          alignItems="center"
          key={idx}
          sx={{ mb: 2 }}
        >
          {/* Name */}
          <Grid item xs={5}>
            <MKInput
              fullWidth
              name="name"
              placeholder="Ingredient"
              value={ing.name}
              onChange={(e) => {
                const newList = [...draft.ingredients];
                newList[idx].name = e.target.value;
                setDraft((d) => ({ ...d, ingredients: newList }));
              }}
            />
          </Grid>

          {/* Amount */}
          <Grid item xs={3}>
            <MKInput
              fullWidth
              name="amount"
              placeholder="Amount"
              value={ing.amount}
              onChange={(e) => {
                const newList = [...draft.ingredients];
                newList[idx].amount = e.target.value;
                setDraft((d) => ({ ...d, ingredients: newList }));
              }}
            />
          </Grid>

          {/* Unit */}
          <Grid item xs={3}>
            <MKInput
              fullWidth
              name="unit"
              placeholder="Unit"
              value={ing.unit}
              onChange={(e) => {
                const newList = [...draft.ingredients];
                newList[idx].unit = e.target.value;
                setDraft((d) => ({ ...d, ingredients: newList }));
              }}
            />
          </Grid>

          {/* Remove */}
          <Grid item xs={1}>
            <MKButton
              color="error"
              size="small"
              onClick={() => {
                const newList = draft.ingredients.filter((_, i) => i !== idx);
                setDraft((d) => ({ ...d, ingredients: newList }));
              }}
            >
              ×
            </MKButton>
          </Grid>
        </Grid>
      ))}

      <MKButton
        onClick={() =>
          setDraft((d) => ({
            ...d,
            ingredients: [
              ...d.ingredients,
              { name: "", amount: "", unit: "" },
            ],
          }))
        }
      >
        + Add Ingredient
      </MKButton>
    </>
  ) : (
    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
      {recipe.ingredients.map((ing, idx) => (
        <Box component="li" key={idx}>
          <MKTypography variant="body1">
            {ing.name} – {ing.amount} {ing.unit}
          </MKTypography>
        </Box>
      ))}
    </Box>
  )}
</CardContent>

{/* Body: Instructions */}
<CardContent>
  <MKTypography variant="h5" gutterBottom>
    Instructions
  </MKTypography>

  {editMode ? (
    <>
      {draft.instructions.map((step, idx) => (
        <Grid
          container
          spacing={1}
          alignItems="center"
          key={idx}
          sx={{ mb: 2 }}
        >
          {/* Step text */}
          <Grid item xs>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder={`Step ${idx + 1}`}
              value={step}
              onChange={(e) => {
                const newInst = [...draft.instructions];
                newInst[idx] = e.target.value;
                setDraft((d) => ({ ...d, instructions: newInst }));
              }}
            />
          </Grid>

          {/* Remove */}
          <Grid item>
            <MKButton
              color="error"
              size="small"
              onClick={() => {
                const newInst = draft.instructions.filter((_, i) => i !== idx);
                setDraft((d) => ({ ...d, instructions: newInst }));
              }}
            >
              ×
            </MKButton>
          </Grid>
        </Grid>
      ))}

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
    </>
  ) : (
    <Box component="ol" sx={{ pl: 2 }}>
      {recipe.instructions.map((step, idx) => (
        <Box component="li" key={idx} mb={1}>
          <MKTypography variant="body1">{step}</MKTypography>
        </Box>
      ))}
    </Box>
  )}
</CardContent>


          {/* Actions: Like/Comment then Edit/Delete */}
<CardActions sx={{ flexDirection: "column", px: 2, pb: 2 }}>
  {/* 1. Show Like/Comment only when NOT in edit mode */}
  {!editMode && (
    <Grid container spacing={1} justifyContent="center">
      <Grid item>
        <MKButton
          size="small"
          startIcon={<Icon>thumb_up</Icon>}
          disabled={!isAuthed}
          onClick={handleLike}
        >
          Like ({recipe.likeCount})
        </MKButton>
      </Grid>
      <Grid item>
        <MKButton
          size="small"
          startIcon={<Icon>comment</Icon>}
          disabled={!isAuthed}
          onClick={openComment}
        >
          Comment ({recipe.comments.length})
        </MKButton>
      </Grid>
    </Grid>
  )}

  {/* 2. When owner & NOT editing: Edit + Delete */}
  {!editMode && isOwner && (
    <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
      <Grid item>
        <MKButton
          size="small"
          color="dark"
          variant="outlined"
          onClick={() => setEditMode(true)}
        >
          Edit
        </MKButton>
      </Grid>
      <Grid item>
        <MKButton
          size="small"
          color="error"
          variant="outlined"
          onClick={handleDelete}
        >
          Delete
        </MKButton>
      </Grid>
    </Grid>
  )}

  {/* 3. In edit mode (owner only): Save + Cancel; Like/Comment & Edit/Delete are hidden by the above */}
              {editMode && isOwner && (
                <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                  <Grid item>
                    <MKButton
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? <CircularProgress size={20} /> : "Save"}
                    </MKButton>

                    {saveError && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {saveError}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item>
                    <MKButton color="secondary" onClick={() => setEditMode(false)}>
                      Cancel
                    </MKButton>
                  </Grid>
                </Grid>
              )}
</CardActions>

        </RecipeCard>

          {/* Comments List */}
          {recipe.comments?.length > 0 && (
            <Box mt={3}>
              <MKTypography variant="h5" gutterBottom>
                Comments
              </MKTypography>

              {recipe.comments.map((c) => (
                <Box key={c._id} sx={{ border: 1, borderColor: "grey.300", borderRadius: 1, p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <MKTypography variant="subtitle2">
                      {c.author?.name || c.authorId?.name||'—'}
                    </MKTypography>
                    <MKTypography variant="caption" color="text">
                      {new Date(c.createdAt).toLocaleString()}
                    </MKTypography>
                  </Box>
                  <MKTypography variant="body1">{c.content}</MKTypography>
                </Box>
              ))}
            </Box>
          )}

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
      </Container>
    </MKBox>
  );
}