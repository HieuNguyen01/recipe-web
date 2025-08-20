import React, { useState, useCallback } from "react";
import ConfirmDialog from "ui/dialogs/ConfirmDialog";

/**
 * useConfirmDialog
 * Returns:
 *   - openConfirm(opts): opens the dialog with opts
 *   - ConfirmDialogRenderer: a component you place at the root of your page/Tree
 *
 * opts = {
 *   title:       string,
 *   contentText: string,
 *   confirmText: string,
 *   cancelText:  string,
 *   onConfirm:   () => void
 * }
 */
export default function useConfirmDialog() {
  const [options, setOptions] = useState({
    open: false,
    title: "",
    contentText: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: () => {},
  });

  const openConfirm = useCallback((opts) => {
    setOptions({ open: true, ...opts });
  }, []);

  const closeConfirm = useCallback(() => {
    setOptions((o) => ({ ...o, open: false }));
  }, []);

  // The renderer you drop into your JSX
  function ConfirmDialogRender() {
    const { open, title, contentText, cancelText, confirmText, onConfirm } = options;

    return (
      <ConfirmDialog
        open={open}
        title={title}
        contentText={contentText}
        cancelText={cancelText}
        confirmText={confirmText}
        onClose={closeConfirm}
        onConfirm={() => {
          closeConfirm();
          onConfirm();
        }}
      />
    );
  }

  return { openConfirm, ConfirmDialogRender };
}
