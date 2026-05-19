import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

const SFCFooter = () => {
  const currentYear = new Date().getFullYear();
  const { width } = useWindowDimensions();
  const isCompact = width < 700;

  return (
    <View style={styles.footerContainer}>
      <View style={[styles.contentRow, isCompact && styles.contentRowCompact]}>
        <View style={styles.textGroup}>
          <Text style={styles.copyrightText}>
            © {currentYear}{" "}
            <Text style={styles.bold}>SFC Digital Training Platform</Text>. All
            rights reserved.
          </Text>
          <Text style={styles.subText}>
            Managed by Sarawak Forestry Corporation | Official Government Platform
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    width: "100%",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Platform.OS === "web" ? 60 : 25,
  },
  contentRowCompact: {
    paddingHorizontal: 16,
  },
  textGroup: {
    flex: 1,
    alignItems: "center",
  },
  copyrightText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
    textAlign: "center",
  },
  bold: {
    fontWeight: "700",
    color: "#0a6340",
  },
  subText: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});

export default SFCFooter;
