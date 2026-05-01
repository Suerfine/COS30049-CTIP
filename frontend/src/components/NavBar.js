import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Animated,
} from "react-native";
import { Bell, Search } from "lucide-react-native";
import {
  CommonActions,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

// Navigation links animation
const NavItem = ({ name, route, onPress, isActive }) => {
  const scale = useRef(new Animated.Value(0)).current;

  const hoverIn = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hoverOut = () => {
    Animated.timing(scale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      onHoverIn={hoverIn}
      onHoverOut={hoverOut}
      onPressIn={hoverIn} // for mobile
      onPressOut={hoverOut} // for mobile
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.itemText, isActive && styles.activeText]}>
        {name}
      </Text>
      <Animated.View
        style={[styles.underline, { transform: [{ scaleX: scale }] }]}
      />
    </Pressable>
  );
};

const NavBar = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const currentRoute = useNavigationState((state) => {
      if (!state) return null;
      let route=state.routes[state.index];
      while(route.state){
          route=route.state.routes[route.state.index];
      }
      return route.name;
  });

  const displayRoute = (currentRoute === 'ParkGuideStack' || !currentRoute) 
          ? 'Dashboard' 
          : currentRoute;
  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      }),
    );
  };

  // Navigation Links
  const navLinks = [
    { name: "Courses", route: "Courses" },
    { name: "Badges", route: "Badges" },
    { name: "Anomaly", route: "Anomaly" },
  ];

  return (
    <View style={styles.navbar}>
      <View style={styles.left}>
        <Pressable
          onPress={() => {
              navigation.navigate('ParkGuideStack',{
                  screen:"Dashboard"
              })

          }}
        >
          <Image
            source={require("../../assets/sfc_logo.png")}
            style={styles.logo}
            accessibilityLabel="Logo of SFC"
          />
        </Pressable>
      </View>

      <View style={styles.center}>
        {navLinks.map((item) => (
          <NavItem
            key={item.name}
            name={item.name}
            route={item.route}
            isActive={displayRoute === item.route}
            style={styles.link}
            onPress={() => {
                navigation.navigate('ParkGuideStack',{
                    screen:item.route
                })

            }}
          />
        ))}
      </View>

      <View style={styles.right}>
        <View style={styles.search}>
          <Search size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor="#8f8f8f"
          />
        </View>
        <Pressable style={styles.notificationBtn}>
          <Bell size={20} />
        </Pressable>
        <Pressable style={styles.profileBtn} onPress={() => {
              navigation.navigate('ParkGuideStack',{
                  screen:"UserProfile"
              })

          }}>
          <Image
            source={require("../../assets/profile.png")}
            style={styles.profile}
            accessibilityLabel="User Profile"
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 40,
    resizeMode: "contain",
  },
  center: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    gap: 80,
  },
  link: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    paddingBottom: 2,
  },
  activeText: {
    color: "#efab21",
    fontWeight: "700",
  },
  underline: {
    height: 2,
    width: "100%",
    marginTop: 2,
    backgroundColor: "#efab21",
  },
  right: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 15,
  },
  search: {
    flexDirection: "row",
    gap: 3,
    borderWidth: 1,
    borderColor: "#8f8f8f",
    paddingVertical: 5,
    paddingHorizontal: 3,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    marginHorizontal: 20,
    width: 220,
  },
  input: {
    flex: 1,
    maxWidth: 220,
    outlineStyle: "none",
  },
  notificationBtn: {
    padding: 5,
  },
  profileBtn: {},
  profile: {
    width: 35,
    height: 35,
    borderRadius: 50,
    resizeMode: "contain",
  },
});

export default NavBar;
