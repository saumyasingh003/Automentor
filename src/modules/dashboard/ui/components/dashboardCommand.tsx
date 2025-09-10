import { CommandInput, CommandList, CommandResponsiveDialog } from "@/components/ui/command";
import { CommandItem } from "cmdk";
import { Dispatch, SetStateAction } from "react";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  return (
    <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
      <CommandInput  placeholder="Find a meeting or Agent"/>

      <CommandList>
        <CommandItem>
          test
        </CommandItem>
      </CommandList>
    </CommandResponsiveDialog>
  );
};

export default DashboardCommand;