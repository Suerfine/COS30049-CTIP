import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Preferences = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Preference screen</Text>
    </View>
  );
};

export default Preferences;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});