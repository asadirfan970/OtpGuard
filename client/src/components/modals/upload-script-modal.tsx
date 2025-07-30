import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadScriptModal({ open, onOpenChange }: UploadScriptModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    appName: "",
    file: null as File | null,
  });

  const uploadScriptMutation = useMutation({
    mutationFn: ({ appName, file }: { appName: string; file: File }) =>
      api.uploadScript(appName, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Script uploaded",
        description: "Script has been successfully uploaded",
      });
      onOpenChange(false);
      setFormData({ appName: "", file: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }
    uploadScriptMutation.mutate({
      appName: formData.appName,
      file: formData.file,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.py')) {
        toast({
          title: "Error",
          description: "Only Python (.py) files are allowed",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Script</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              App Name
            </Label>
            <Input
              type="text"
              placeholder="e.g., MICO, WhatsApp"
              value={formData.appName}
              onChange={(e) =>
                setFormData({ ...formData, appName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Python Script File
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {formData.file ? formData.file.name : "Drag and drop or click to select .py file"}
              </p>
              <Input
                type="file"
                accept=".py"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select File
              </Button>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={uploadScriptMutation.isPending}
            >
              {uploadScriptMutation.isPending ? "Uploading..." : "Upload Script"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
