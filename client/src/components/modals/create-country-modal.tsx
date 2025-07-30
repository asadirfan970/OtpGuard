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
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateCountryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCountryModal({ open, onOpenChange }: CreateCountryModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    numberLength: "",
  });

  const createCountryMutation = useMutation({
    mutationFn: (countryData: { name: string; code: string; numberLength: number }) =>
      api.createCountry(countryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Country added",
        description: "Country has been successfully added",
      });
      onOpenChange(false);
      setFormData({ name: "", code: "", numberLength: "" });
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
    const numberLength = parseInt(formData.numberLength);
    if (isNaN(numberLength) || numberLength <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number length",
        variant: "destructive",
      });
      return;
    }
    
    createCountryMutation.mutate({
      name: formData.name,
      code: formData.code,
      numberLength,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Add Country</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Country Name
            </Label>
            <Input
              type="text"
              placeholder="e.g., Mali"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Country Code
            </Label>
            <Input
              type="text"
              placeholder="e.g., +223"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number Length
            </Label>
            <Input
              type="number"
              placeholder="e.g., 8"
              value={formData.numberLength}
              onChange={(e) =>
                setFormData({ ...formData, numberLength: e.target.value })
              }
              min="1"
              required
            />
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
              disabled={createCountryMutation.isPending}
            >
              {createCountryMutation.isPending ? "Adding..." : "Add Country"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
