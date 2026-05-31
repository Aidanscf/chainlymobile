import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { colors } from "../theme/index";

const Avatar = ({ source, size = 50, style }) => {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Image
        source={typeof source === "string" ? { uri: source } : source}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default Avatar;
