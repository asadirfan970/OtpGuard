import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Code, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UploadScriptModal from "@/components/modals/upload-script-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Scripts() {
  const { toast } = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);
  const updateScriptMutation = useMutation({
    mutationFn: (scriptData: { id: string; appName: string }) =>
      api.updateScript(scriptData.id, { appName: scriptData.appName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Script updated",
        description: "Script has been successfully updated",
      });
      setShowEditModal(false);
      setEditingScript(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: scripts, isLoading } = useQuery({
    queryKey: ["/api/scripts"],
    queryFn: () => api.getScripts(),
  });

  const deleteScriptMutation = useMutation({
    mutationFn: (id: string) => api.deleteScript(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Script deleted",
        description: "Script has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteScript = (id: string) => {
    if (confirm("Are you sure you want to delete this script?")) {
      deleteScriptMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Script Management</h3>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Script
          </Button>
        </div>

        {/* Scripts Grid */}
        <CardContent className="p-6">
          {!scripts || scripts.length === 0 ? (
            <div className="text-center py-8">
              <Code className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No scripts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first automation script.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Script
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scripts.map((script: any) => (
                <div
                  key={script.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Code className="text-primary text-xl" />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setEditingScript(script);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteScript(script.id)}
                        disabled={deleteScriptMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {script.appName}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">{script.fileName}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Size: {formatFileSize(script.fileSize)}
                    </span>
                    <span className="text-gray-500">
                      {new Date(script.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadScriptModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      {/* Edit Script Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) setEditingScript(null);
      }}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Script</DialogTitle>
          </DialogHeader>
          {editingScript && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                updateScriptMutation.mutate({
                  id: editingScript.id,
                  appName: editingScript.appName,
                });
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                <Input
                  type="text"
                  value={editingScript.appName}
                  onChange={e => setEditingScript({ ...editingScript, appName: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updateScriptMutation.isPending}>
                  {updateScriptMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
