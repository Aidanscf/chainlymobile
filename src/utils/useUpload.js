import * as React from "react";
import { apiUploadFile } from "@/services/apiClient";

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        const asset = input.reactNativeAsset;
        const uri = asset?.uri ? String(asset.uri) : "";
        if (!uri) {
          throw new Error("Couldn't read the image.");
        }
        const mimeType =
          asset.mimeType ||
          (String(asset.type || "").startsWith("image/")
            ? String(asset.type)
            : "image/jpeg");
        const name = asset.fileName || asset.name || undefined;
        const url = await apiUploadFile(uri, { name, mimeType });
        return { url, mimeType };
      } else if ("url" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useUpload] Upload API failed:", response.status, errorText);
        
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      console.error("[useUpload] Critical error during upload process:", uploadError);
      
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;