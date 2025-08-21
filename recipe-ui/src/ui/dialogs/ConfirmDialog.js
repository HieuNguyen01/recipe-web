import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  Slide,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * A reusable confirmation dialog.
 *
 * Props:
 *   open                Boolean
 *   title               String
 *   contentText         String
 *   onClose             () => void
 *   onConfirm           () => void
 *   cancelText          String (default: "Cancel")
 *   confirmText         String (default: "Confirm")
 *   cancelButtonProps   Object props spread onto the Cancel <Button>
 *   confirmButtonProps  Object props spread onto the Confirm <Button>
 */
function ConfirmDialog({
  open,
  title,
  contentText,
  onClose,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  cancelButtonProps = {},
  confirmButtonProps = {},
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
          <DialogContentText>{contentText}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} {...cancelButtonProps}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} {...confirmButtonProps}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(ConfirmDialog);
