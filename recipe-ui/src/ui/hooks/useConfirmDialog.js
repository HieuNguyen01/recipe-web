import React, { useState, useCallback } from "react";
import ConfirmDialog from "ui/dialogs/ConfirmDialog";

export default function useConfirmDialog() {
  const [opts, setOpts] = useState({
    open: false,
    title: "",
    contentText: "",
    cancelText: "Cancel",
    confirmText: "Confirm",
    cancelButtonProps: {},
    confirmButtonProps: {},
    onConfirm: () => {},
  });

  const openConfirm = useCallback((options) => {
    setOpts({ open: true, ...options });
  }, []);

  const closeConfirm = useCallback(() => {
    setOpts((o) => ({ ...o, open: false }));
  }, []);

  const ConfirmDialogRender = useCallback(() => {
    const {
      open,
      title,
      contentText,
      cancelText,
      confirmText,
      cancelButtonProps,
      confirmButtonProps,
      onConfirm,
    } = opts;

    const handleConfirm = () => {
      closeConfirm();
      onConfirm();
    };

    return (
      <ConfirmDialog
        open={open}
        title={title}
        contentText={contentText}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        cancelText={cancelText}
        confirmText={confirmText}
        cancelButtonProps={cancelButtonProps}
        confirmButtonProps={confirmButtonProps}
      >
      </ConfirmDialog>
    );
  }, [opts, closeConfirm]);

  return { openConfirm, ConfirmDialogRender };
}
