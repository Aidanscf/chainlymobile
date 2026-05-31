import * as React from 'react';
import { UploadClient } from '@uploadcare/upload-client'
const client = new UploadClient({ publicKey: process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY });

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        let asset = input.reactNativeAsset;

        if (asset.file) {
          const formData = new FormData();
          formData.append("file", asset.file);

          response = await fetch("/_create/api/upload/", {
            method: "POST",
            body: formData,
          });
        } else {
          // Fallback to presigned Uploadcare upload
          console.log("[useUpload] Requesting presigned URL...");
          const presignRes = await fetch("/_create/api/upload/presign/", {
            method: "POST",
          });

          if (!presignRes.ok) {
            const errorText = await presignRes.text();
            console.error("[useUpload] Presign request failed:", presignRes.status, errorText);
            throw new Error(`Failed to get upload signature: ${presignRes.status}`);
          }

          const { secureSignature, secureExpire } = await presignRes.json();
          console.log("[useUpload] Got signature, uploading to storage...");

          const result = await client.uploadFile(asset, {
            fileName: asset.name ?? asset.uri.split("/").pop(),
            contentType: asset.mimeType,
            secureSignature,
            secureExpire
          });
          
          console.log("[useUpload] Storage upload successful:", result.uuid);
          return { 
            url: `${process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL}/${result.uuid}/`, 
            mimeType: result.mimeType || asset.mimeType || null 
          };
        }
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