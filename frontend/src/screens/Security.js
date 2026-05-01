import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Security = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Security screen</Text>
    </View>
  );
};

export default Security;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});