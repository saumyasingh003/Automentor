import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { JSX, useState } from "react";

export const useConfirm = (
  title: string,
  description: string
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  // Function to trigger the confirm dialog
  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };
  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const confirmationDialog = () => (
    <ResponsiveDialog
      open={promise !== null}
      onOpenChange={handleClose}
      title={title}
      description={description}
    >
      <div className="pt-4 w-full flex  items-center justify-end gap-x-2 flex-col-reverse gap-y-2 lg:flex-row">
        <Button
          onClick={handleCancel}
          variant="outline"
          className="w-full lg:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className="w-full lg:w-auto bg-red-500 hover:bg-red-500"
        >
          Confirm
        </Button>
      </div>
    </ResponsiveDialog>
  );
  return [confirmationDialog, confirm];
};
