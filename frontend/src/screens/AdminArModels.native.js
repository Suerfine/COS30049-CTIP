import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AdminArModels = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Model Library</Text>
      <Text style={styles.subtitle}>
        This admin tool is available on the web dashboard.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
});

export default AdminArModels;
