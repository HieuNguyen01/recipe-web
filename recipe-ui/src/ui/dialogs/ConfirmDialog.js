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

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

/**
 * Props:
 *  - open           Boolean
 *  - title          String
 *  - contentText    String (optional) or use children for custom content
 *  - onClose        Function
 *  - onConfirm      Function
 *  - cancelText     String (default: "Cancel")
 *  - confirmText    String (default: "Confirm")
 */
export default function ConfirmDialog({
  open,
  title,
  contentText,
  children,
  onClose,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
}) {
  const theme      = useTheme();
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
        {contentText
          ? <DialogContentText>{contentText}</DialogContentText>
          : children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button variant="contained" color="primary" onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
