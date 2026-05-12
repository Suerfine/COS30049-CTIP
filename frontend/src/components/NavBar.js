import React, { useRef, useState,useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Animated,
  Platform,
  useWindowDimensions
} from "react-native";
import { Bell, Search, LogOut, ChevronDown, ChevronUp, Menu, X } from "lucide-react-native";
import {
  CommonActions,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useUserDashboard } from "../hooks/useUserDashboard";

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
  const { user } = useUserDashboard();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentRoute = useNavigationState((state) => {
    let route = state.routes[state.index];

    while (route.state) {
      route = route.state.routes[route.state.index];
    }

    return route.name;
  });

  const isActiveRoute = (routeName) =>{
    return currentRoute === routeName;
  }

  // close dropdown when click anywhere else
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleClickOutside = (event) => {
      if (!dropdownVisible) return;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownVisible]);

  const displayRoute = (currentRoute === 'ParkGuideStack' || !currentRoute) 
          ? 'Dashboard' 
          : currentRoute;
          
  const handleLogout = async () => {
    setMobileMenuOpen(false);
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
    { name: "Badge", route: "Badge" },
    { name: "Anomaly", route: "Anomaly" },
  ];

  if (isMobile) {
    return (
      <>
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

          <View style={styles.right}>
            <View style={styles.search}>
              <Search size={18} />
              <TextInput
                style={styles.input}
                placeholder="Search..."
                placeholderTextColor="#8f8f8f"
              />
            </View>
            <Pressable
              onPress={() => setMobileMenuOpen((prev) => !prev)}
              style={styles.hamburgerBtn}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </Pressable>
          </View>
        </View>

        {mobileMenuOpen && (
          <Pressable
            style={styles.overlay}
            onPress={() => setMobileMenuOpen(false)}
          />
        )}

        {mobileMenuOpen && (
          <>
            <View style={styles.mobileMenu}>
              {navLinks.map((item) => (
                <Pressable
                  key={item.name}
                  style={styles.mobileMenuItem}
                  onPress={() => {
                    setMobileMenuOpen(false);

                    navigation.navigate("ParkGuideStack", {
                      screen: item.route,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.mobileMenuText,
                      displayRoute === item.route && styles.activeText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.mobileMenuItem}
                onPress={() => {
                  setMobileMenuOpen(false);

                  navigation.navigate("ParkGuideStack", {
                    screen: "Notification",
                  });
                }}
              >
                <Text style={styles.mobileMenuText}>Notifications</Text>
              </Pressable>

              <Pressable
                style={styles.mobileMenuItem}
                onPress={() => {
                  setMobileMenuOpen(false);

                  navigation.navigate("ParkGuideStack", {
                    screen: "ProfileStack",
                    params: {
                      screen: "UserProfile",
                    },
                  });
                }}
              >
                <Text style={styles.mobileMenuText}>Profile</Text>
              </Pressable>

              <Pressable
                style={styles.mobileMenuItem}
                onPress={handleLogout}
              >
                <Text
                  style={[
                    styles.mobileMenuText,
                    { color: "red" },
                  ]}
                >
                  Logout
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </>
    );
  }

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
        <Pressable 
          style={styles.notificationBtn}
          onPress={()=>navigation.navigate(
            'ParkGuideStack',{
              screen:'Notification'
            }
        )}>
          <Bell size={20} />
        </Pressable>
        <View style={styles.profileWrapper}>
          <Pressable style={styles.profileBtn} onPress={() => setDropdownVisible((prev) => !prev)} >
              <View style={styles.profileRow}>
                {dropdownVisible ? (
                  <ChevronUp size={16}/>
                ) : (
                  <ChevronDown size={16}/>
                )}

                <View style={styles.prfpWrapper}>
                  {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.pfp}/>
                  ) : (
                      <View style={styles.pfpPlaceholder}>
                          <Text style={styles.pfpInitials}>
                              {user?.firstname ? user?.firstname[0].toUpperCase() : '?'}
                          </Text>
                      </View>
                    )}
                </View>
              </View>
          </Pressable>
          {dropdownVisible && (
            <View ref={dropdownRef} style={styles.dropdown}>
              {/* user info */}
              <Pressable style={({ hovered, pressed }) => [
                  styles.dropdownItem,
                  isActiveRoute("UserProfile") && styles.dropdownItemActive,
                  hovered && styles.dropdownItemHover,
                ]} onPress={() => navigation.navigate("ParkGuideStack", {
                  screen: "ProfileStack",
                  params: {
                    screen: "UserProfile",
                  },
                })}>
                <View style={styles.nameSection}>
                  <Text style={styles.name}>
                    {user?.firstname}
                  </Text>
                  <Text style={styles.username}>@
                    {user?.username}
                  </Text>
                </View>
              </Pressable>

              {/* preferences */}
              <Pressable style={({ hovered, pressed }) => [
                  styles.dropdownItem, isActiveRoute("Preferences") && styles.dropdownItemActive,
                  hovered && styles.dropdownItemHover,
                ]}
                onPress={() => navigation.navigate("ParkGuideStack", {
                  screen: "ProfileStack",
                  params:{
                    screen: "Preferences"
                  }
                })}
              >
                <Text>Preference</Text>
              </Pressable>

              {/* security */}
              <Pressable style={({ hovered, pressed }) => [
                  styles.dropdownItem, isActiveRoute("Security") && styles.dropdownItemActive,
                  hovered && styles.dropdownItemHover,
                ]}
                onPress={() => navigation.navigate("ParkGuideStack", {
                  screen: "ProfileStack",
                  params:{
                    screen: "Security"
                  }
                })}
              >
                <Text>Security</Text>
              </Pressable>

              <Pressable
                style={styles.dropdownItem}
                onPress={handleLogout}
              >
                <View style={styles.logoutBtn}>
                  <LogOut size={16} />

                  <Text style={{ color: "red" }}>
                    Logout
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
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
    overflow: 'visible',
    zIndex: 1000,
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
  profile: {
    width: 35,
    height: 35,
    borderRadius: 50,
    resizeMode: "contain",
  },
  profileBtn: {
    padding: 5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileWrapper: {
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    zIndex: 9999,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dropdownItem:{
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownItemHover: {
    backgroundColor: "#E8F5E9",
  },
  dropdownItemActive: {
    backgroundColor: "#E8F5E9",
  },
  nameSection:{
    flexDirection: 'column',
  },  
  name:{
    fontWeight: 'bold',
    fontSize: 17
  },  
  username:{
    fontSize: 12,
    color: '#818181'
  },  
  logoutBtn:{
    flexDirection: 'row',
    gap: 10,
    color: 'red',
  },
  pfp:{
    width: 33,
    height: 33,
    borderRadius: 60,
    borderColor: 'white',
  },
  pfpPlaceholder:{
    width: 33,
    height: 33,
    borderRadius: 60,
    backgroundColor: '#2f6618fe',
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pfpInitials:{
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  hamburgerBtn: {
    padding: 5,
  },
  mobileMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    zIndex: 9999,
    paddingVertical: 10,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mobileMenuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  mobileMenuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 9998,
    elevation: 5,
  },
});

export default NavBar;
