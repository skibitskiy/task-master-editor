export interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (branchName: string) => void;
}
