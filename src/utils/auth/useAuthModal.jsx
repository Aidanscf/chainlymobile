import React from "react";
import { Modal, View } from "react-native";
import { AuthWebView } from "./AuthWebView";
import { useAuthModal, useAuthStore } from "./store";

/**
 * This component renders a modal for authentication purposes.
 *
 * It is mounted once in RootLayout so any screen can call `useAuth().signIn()` / `signUp()`.
 */
export const AuthModal = () => {
  const { isOpen, mode } = useAuthModal();
  const status = useAuthStore((s) => s.status);

  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  if (!proxyURL && !baseURL) {
    return null;
  }

  const visible = isOpen && status !== "authenticated";

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          width: "100%",
          backgroundColor: "#fff",
          padding: 0,
        }}
      >
        {isOpen && (
          <AuthWebView mode={mode} proxyURL={proxyURL} baseURL={baseURL} />
        )}
      </View>
    </Modal>
  );
};

export default AuthModal;
