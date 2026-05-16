import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { LockKeyhole, UserRoundPen, Settings2 } from "lucide-react-native";
import { useNavigationState, useNavigation } from "@react-navigation/native";

const ProfileSideBar = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const currentRoute = useNavigationState((state) => {
    let route = state.routes[state.index];
    const rootRouteName = route.name;
    const explicitScreen = route.params?.screen;

    if (route.state) {
      while (route.state) {
        route = route.state.routes[route.state.index];
      }
      return route.name;
    }

    return explicitScreen || rootRouteName;
  });

  const menuItems = [
    { name: "Profile", icon: UserRoundPen, route: "UserProfile" },
    { name: "Preferences", icon: Settings2, route: "Preferences" },
    { name: "Security", icon: LockKeyhole, route: "Security" },
  ];

  return (
    <View style={[styles.sidebar, isMobile && styles.sidebarSmall]}>
      <View style={styles.link}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <Pressable
              key={item.name}
              style={({ hovered }) => [
                styles.menuItem,
                isMobile && styles.menuItemSmall,
                isActive && styles.activeIcon,
                !isActive && hovered && styles.hoverStyle,
              ]}
              onPress={() => {
                setActivePage(item.name);
                navigation.navigate("ProfileStack", {
                  screen: item.route,
                });
              }}
            >
              <IconComponent size={22} color={isActive ? "white" : "black"} />
              {!isMobile && (
                <Text style={[styles.navText, isActive && styles.activeText]}>
                  {item.name}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    minHeight: "100vh",
    userSelect: "none",
    paddingHorizontal: 20,
    paddingTop: 30,
    borderRightColor: "#3f3f3f4d",
    borderRightWidth: 1,
    backgroundColor: "white",
  },
  sidebarSmall: {
    width: 72,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  link: {
    gap: 30,
    paddingBottom: 25,
  },
  linkbtn: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 13,
    minWidth: 166,
    borderRadius: "5px",
    alignItems: "center",
  },
  menuItemSmall: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
    gap: 0,
  },
  navText: {
    fontSize: 15,
  },
  activeIcon: {
    backgroundColor: "#0a6340",
  },
  activeText: {
    color: "white",
  },
  hoverStyle: {
    backgroundColor: "#eaefeb",
  },
});

export default ProfileSideBar;
