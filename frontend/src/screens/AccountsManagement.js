import {
  Pen,
  Trash2,
  Search,
  Plus,
  Circle,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  X,
  User2,
  IdCard,
  Mail,
  ShieldUser,
  Calendar,
  FileUser,
  EllipsisVertical,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  CircleMinus,
  MessageSquare,
  Phone,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  RotateCcw,
  UserRoundKey,
  SquarePen,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";

// Import other components and hooks
import { useAccountManagement } from "../hooks/useAccountManagement";
import { formatDate } from "../utils/formatDate";
import ModalLayout from "../components/ModalLayout";
import UsersFormContent from "../components/UsersFormContent";
import { ScrollView } from "react-native-gesture-handler";
import { useUserDashboard } from "../hooks/useUserDashboard";

const AccountManagement = () => {
  const {
    accounts,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    searchQuery,
    handleSearch,
    sortConfig,
    requestSort,
    resetSort,
    handleCreateAccount,
    loading,
    refresh,
    handleUpdateAccount,
    handleDeleteAccount,
    pickProfilePicture,
    currentRole,
    setCurrentRole,
    setEditErrors, editErrors, validateEditForm,editForm, setEditForm
  } = useAccountManagement();
  const [pendingImage, setPendingImage] = useState(null);
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const { t } = useTranslation();

  const handleStartEdit = () => {
    setEditForm({ ...selectedAcc });
    setIsEditing(true);
    setEditErrors({});
    setActiveMenuId(null);
  };

  const handleAdd = () => {
    setModalVisible(true);
  };

  const onCreateSuccess = async () => {
    setModalVisible(false);
    await refresh();
  };

  const onSaveEdit = async () => {
    if (!validateEditForm()) return;
    const result = await handleUpdateAccount(
      selectedAcc.id,
      editForm,
      pendingImage ?? null,
    );
    if (result?.success) {
      setIsEditing(false);
      setActiveMenuId(null);
      setSelectedAcc({
        ...editForm,
        profileImage: pendingImage?.uri ?? getProfileImageUri(selectedAcc),
      });
      setPendingImage(null);
    } else {
      console.error("Failed to update:", result?.serverError);
    }
  };

  const getProfileImageUri = (item) =>
    item?.profileImage ||
    item?.pfp_url ||
    item?.pfp ||
    item?.user_profile_image ||
    item?.profile_image ||
    null;

  const onDeletePress = () => {
    if (!selectedAcc) return;
    const confirmDelete = () => {
      const message = `Are you sure you want to delete ${selectedAcc.firstname}?`;

      if (Platform.OS === "web") {
        if (window.confirm(message)) {
          executeDelete();
        }
      } else {
        Alert.alert("Delete User", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDelete },
        ]);
      }
    };

    const executeDelete = async () => {
      const result = await handleDeleteAccount(selectedAcc.id);
      setSelectedAcc(null);
      setIsEditing(false);
      await refresh();
    };

    confirmDelete();
  };

  // Calculate the pagination
  const itemsPerPage = 10;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + (accounts?.length || 0);
  const estimatedTotal = totalPages * itemsPerPage;
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const renderHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerRow, { flex: 1, textAlign: "center" }]}>
        <Text style={styles.headerText}>{t("id")}</Text>
      </Text>
      <Pressable
        onPress={() => requestSort("firstname")}
        style={[styles.headerRow, { flex: 3 }]}
      >
        <Text style={styles.headerText}>{t("full_name")}</Text>
        {sortConfig.key === "firstname" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Pressable
        onPress={() => requestSort("username")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>{t("username")}</Text>
        {sortConfig.key === "username" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerRow, { flex: 3 }]}>
        <Text style={styles.headerText}>{t("work_email")}</Text>
      </Text>
      <Text style={[styles.headerRow, { flex: 1 }]}>
        <Text style={styles.headerText}>{t("role")}</Text>
      </Text>
      <Pressable
        onPress={() => requestSort("created_at")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>{t("joined_on")}</Text>
        {sortConfig.key === "created_at" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Pressable
        onPress={() => requestSort("last_login_at")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>{t("last_login")}</Text>
        {sortConfig.key === "last_login_at" &&
        sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <Pressable
      onPress={() => setSelectedAcc(item)}
      style={({ hovered }) => [
        styles.row,
        styles.tableRow,
        hovered && { backgroundColor: "#f9f9f9" },
        selectedAcc?.id === item.id && { backgroundColor: "#fff8e1" },
      ]}
    >
      <Text style={{ flex: 1, textAlign: "center" }}>{item.id}</Text>
      <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
        {getProfileImageUri(item) ? (
          <Image
            source={{ uri: getProfileImageUri(item) }}
            style={styles.avatar}
            accessibilityLabel={`Profile Image of ${item.firstname + " " + item.lastname}`}
          />
        ) : (
          <View style={styles.pfpPlaceholder}>
            <Text style={styles.pfpInitials}>
              {item.firstname ? item.firstname[0].toUpperCase() : "?"}
            </Text>
          </View>
        )}
        <Text>{item.firstname + " " + item.lastname}</Text>
      </View>
      <Text style={{ flex: 2 }}>{item.username}</Text>
      {/* Work Email */}
      <Text style={{ flex: 3 }}>{item.username + "@sfc.gov.my"}</Text>
      {/* Role */}
      <Text style={{ flex: 1 }}>
        {item.role === "admin" ? t("role.admin") : t("role.park_guide")}
      </Text>
      <Text style={{ flex: 2 }}>{formatDate(item.created_at)}</Text>
      <Text style={{ flex: 2 }}>{formatDate(item.last_login_at)}</Text>
    </Pressable>
  );

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return (
      <View style={[styles.paginationContainer, styles.row]}>
        <Text style={styles.pageInfo}>
          {t("showing")} {accounts?.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
          {t("to")} {indexOfLastItem} {t("of")} {totalUsers} {t("users")}
        </Text>
        <View style={styles.row}>
          <Pressable
            disabled={currentPage == 1}
            onPress={() => setCurrentPage(1)}
            style={[styles.pageBtn, currentPage == 1 && styles.btnDisabled]}
          >
            <Text
              style={[
                currentPage == 1 ? styles.disabledText : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronsLeft size={20} />
            </Text>
          </Pressable>
          <Pressable
            disabled={currentPage == 1}
            onPress={() => setCurrentPage((prev) => prev - 1)}
            style={[styles.pageBtn, currentPage == 1 && styles.btnDisabled]}
          >
            <Text
              style={[
                currentPage == 1 ? styles.disabledText : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronLeft size={20} />
            </Text>
          </Pressable>
          {pages.map((number) => (
            <Pressable
              key={number}
              onPress={() => setCurrentPage(number)}
              style={[
                styles.pageBtn,
                currentPage === number && styles.activePageBtn,
              ]}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  currentPage === number && styles.activePageBtn,
                ]}
              >
                {number}
              </Text>
            </Pressable>
          ))}
          <Pressable
            disabled={currentPage == totalPages}
            onPress={() => setCurrentPage((prev) => prev + 1)}
            style={[
              styles.pageBtn,
              currentPage == totalPages && styles.btnDisabled,
            ]}
          >
            <Text
              style={[
                currentPage == totalPages
                  ? styles.disabledText
                  : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronRight size={20} />
            </Text>
          </Pressable>
          <Pressable
            disabled={currentPage == totalPages}
            onPress={() => setCurrentPage(totalPages)}
            style={[
              styles.pageBtn,
              currentPage == totalPages && styles.btnDisabled,
            ]}
          >
            <Text
              style={[
                currentPage == totalPages
                  ? styles.disabledText
                  : styles.pageBtnText,
                styles.arrowBtn,
              ]}
            >
              <ChevronsRight size={20} />
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>{t("account_management")}</Text>
      <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
        <View
          style={[styles.toolbarRow, isCompact && styles.toolbarGroupCompact]}
        >
          <Pressable
            onPress={resetSort}
            style={({ hovered }) => [
              styles.iconBtn,
              hovered && styles.iconBtnHover,
            ]}
          >
            <RotateCcw size={20} />
          </Pressable>
          <View style={[styles.search, styles.row]}>
            <Search size={18} />
            <TextInput
              style={styles.input}
              placeholder={t("search")}
              placeholderTextColor="#8f8f8f"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          <View style={styles.dropdownWrapper}>
            <Pressable
              style={styles.pillTrigger}
              onPress={() => setIsOpen(!isOpen)}
            >
              <Text style={styles.pillText}>
                {currentRole !== "all" ? t(`role.${currentRole}`) : t("role")}
              </Text>
              {isOpen ? (
                <ChevronUp size={16} color="#4b5563" />
              ) : (
                <ChevronDown size={16} color="#4b5563" />
              )}
            </Pressable>

            {isOpen && (
              <View style={styles.dropdownMenu}>
                {[
                  { key: "all", label: t("role") },
                  { key: "admin", label: t("role.admin") },
                  { key: "park_guide", label: t("role.park_guide") },
                ].map((role) => (
                  <Pressable
                    key={role.key}
                    style={({ hovered }) => [
                      styles.menuItem,
                      currentRole === role.key && styles.menuItemActive,
                      hovered &&
                        currentRole !== role.key &&
                        styles.menuItemHover,
                    ]}
                    onPress={() => {
                      setCurrentRole(role.key);
                      setCurrentPage(1);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        currentRole === role.key && styles.menuItemTextActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ hovered }) => [
              styles.btn,
              styles.addUserBtn,
              hovered && styles.btnHover,
            ]}
          >
            <Plus size={16} style={styles.btnText} />
            <Text style={styles.btnText}>{t("add_user")}</Text>
          </Pressable>
        </View>
      </View>

      <ModalLayout
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <UsersFormContent
          onCancel={() => setModalVisible(false)}
          onSubmit={async (formData) => {
            const result = await handleCreateAccount(formData);
            if (result?.success) {
              await onCreateSuccess();
            }
          }}
          isLoading={loading}
        />
      </ModalLayout>

      <View style={styles.tableContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={styles.tableInner}>
            <FlatList
              style={styles.table}
              scrollEnabled={false}
              data={accounts || []}
              ListHeaderComponent={renderHeader}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.tableRow}>
                  <Text style={{ flex: 1, paddingVertical: 2 }}>
                    {t("no_users_found")}
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      </View>
      {totalPages > 1 ? renderPagination() : null}

      {selectedAcc && (
        <View style={[styles.sidePanel, isCompact && styles.sidePanelCompact]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>User Information</Text>
              <Pressable
                onPress={() => {
                  setSelectedAcc(null);
                  setIsEditing(false);
                }}
              >
                <X size={18} />
              </Pressable>
            </View>
            <View style={styles.panelContent}>
              <View style={styles.actionMenu}>
                <Pressable
                  onPress={() =>
                    setActiveMenuId(
                      activeMenuId === selectedAcc.id ? null : selectedAcc.id,
                    )
                  }
                >
                  <EllipsisVertical />
                </Pressable>
                {activeMenuId === selectedAcc.id && (
                  <View style={styles.floatingMenu}>
                    <Pressable
                      style={({ hovered }) => [
                        styles.menuItem,
                        hovered && styles.menuItemHover,
                      ]}
                      onPress={handleStartEdit}
                    >
                      <View style={[styles.row, styles.option]}>
                        <Pen size={16} color="orange" />
                        <Text style={styles.menuText}>Edit</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={({ hovered }) => [
                        styles.menuItem,
                        hovered && styles.menuItemHover,
                      ]}
                      onPress={onDeletePress}
                    >
                      <View style={[styles.row, styles.option]}>
                        <Trash2 size={16} color="orange" />
                        <Text style={styles.menuText}>Delete</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
              {(isEditing && pendingImage?.uri) ||
              getProfileImageUri(selectedAcc) ? (
                <Image
                  source={{
                    uri:
                      isEditing && pendingImage?.uri
                        ? pendingImage.uri
                        : getProfileImageUri(selectedAcc),
                  }}
                  style={styles.largeAvatar}
                />
              ) : (
                <View style={styles.SideBarPlaceholder}>
                  <Text style={styles.sideBarInitials}>
                    {selectedAcc?.firstname
                      ? selectedAcc.firstname[0].toUpperCase()
                      : "?"}
                  </Text>
                </View>
              )}
              {isEditing && (
                <Pressable
                  style={styles.editProfilePicBtn}
                  onPress={async () => {
                    const picked = await pickProfilePicture();
                    if (picked) {
                      setPendingImage(picked);
                    }
                  }}
                >
                  <View style={styles.editBtnWrapper}>
                    <SquarePen size={16} color="black" />
                  </View>
                </Pressable>
              )}

              {isEditing ? (
                <View style={styles.nameEditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panelLabel}>{t('first name')}</Text>
                    <TextInput
                      style={[styles.userDetails, styles.inputEditing]}
                      value={editForm?.firstname || ""}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, firstname: text })
                      }
                    />
                    {editErrors.firstname && <Text style={styles.errorLabelMicro}>{editErrors.firstname}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panelLabel}>Last Name</Text>
                    <TextInput
                      style={[styles.userDetails, styles.inputEditing]}
                      value={editForm?.lastname || ""}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, lastname: text })
                      }
                    />
                    {editErrors.lastname && <Text style={styles.errorLabelMicro}>{editErrors.lastname}</Text>}
                  </View>
                </View>
              ) : (
                <Text style={styles.fullname}>
                  {selectedAcc.firstname + " " + selectedAcc.lastname}
                </Text>
              )}

              <View style={styles.user}>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <User2 size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Username:</Text>
                  </View>
                  {isEditing ? (
                    <View>
                      <TextInput
                        style={[styles.userDetails, styles.inputEditing, editErrors.username && styles.inputErrorStyle]}
                        value={editForm?.username || ""}
                        onChangeText={(text) => setEditForm({ ...editForm, username: text })}
                      />
                      {editErrors.username && <Text style={styles.errorLabelMicro}>{editErrors.username}</Text>}
                    </View>
                  ) : (
                    <Text style={styles.userDetails}>{selectedAcc.username}</Text>
                  )}
                </View>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <IdCard size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Passport/IC:</Text>
                  </View>
                  <Text style={styles.userDetails}>{selectedAcc.identification}</Text>
                </View>

                <View style={styles.details}>
                  <View style={styles.row}>
                    <Phone size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Telephone:</Text>
                  </View>
                  {isEditing ? (
                    <View>
                      <TextInput
                        style={[styles.userDetails, styles.inputEditing, editErrors.tel && styles.inputErrorStyle]}
                        value={editForm?.tel || ""}
                        onChangeText={(text) => setEditForm({ ...editForm, tel: text })}
                      />
                      {editErrors.tel && <Text style={styles.errorLabelMicro}>{editErrors.tel}</Text>}
                    </View>
                  ) : (
                    <Text style={styles.userDetails}>{selectedAcc.tel}</Text>
                  )}
                </View>

                <View style={styles.details}>
                  <View style={styles.row}>
                    <Mail size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Work Email:</Text>
                  </View>
                  <Text style={styles.userDetails}>
                    {(selectedAcc.username || "") + "@sfc.gov.my"}
                  </Text>
                  <View style={styles.row}>
                    <Text style={[styles.panelLabel, { marginLeft: 35, marginTop: 15 }]}>
                      Personal Email:
                    </Text>
                  </View>
                  {isEditing ? (
                    <View>
                      <TextInput
                        style={[styles.userDetails, styles.inputEditing, editErrors.personal_email && styles.inputErrorStyle]}
                        value={editForm?.personal_email || ""}
                        onChangeText={(text) => setEditForm({ ...editForm, personal_email: text })}
                      />
                      {editErrors.personal_email && <Text style={styles.errorLabelMicro}>{editErrors.personal_email}</Text>}
                    </View>
                  ) : (
                    <Text style={styles.userDetails}>{selectedAcc.personal_email}</Text>
                  )}
                </View>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <UserRoundKey size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Role:</Text>
                  </View>
                  <Text style={styles.userDetails}>
                    {selectedAcc.role == "admin" ? "Admin" : "Park Guide"}
                  </Text>
                </View>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <Calendar size={18} color="#4f4f4f" />
                    <Text style={styles.panelLabel}>Joined On:</Text>
                  </View>
                  <Text style={styles.userDetails}>
                    {formatDate(selectedAcc.created_at)}
                  </Text>
                </View>
              </View>
              {isEditing && (
                <View style={[styles.row, styles.actionBtn]}>
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setPendingImage(null);
                    }}
                    style={styles.Btn}
                  >
                    <Text>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.Btn} onPress={onSaveEdit}>
                    <Text>Save</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  tableRow: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#8f8f8f84",
    alignItems: "center",
  },
  table: {
    backgroundColor: "white",
  },
  tableContainer: {
    width: "100%",
  },
  tableInner: {
    minWidth: 980,
    width: "100%",
  },
  tableScrollContent: {
    minWidth: "100%",
  },
  title: {
    fontSize: 25,
    fontWeight: "500",
  },
  search: {
    borderWidth: 1,
    borderColor: "#8f8f8f",
    width: "auto",
    flexBasis: 300,
    minWidth: 80,
    maxWidth: 300,
    flexShrink: 1,
    flexGrow: 1,
    padding: 5,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    maxHeight: 35,
    alignSelf: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
    marginLeft: 10,
  },
  toolbar: {
    marginVertical: 20,
    alignItems: "center",
    zIndex: 600,
  },
  toolbarCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  toolbarRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 12,
    flexWrap: "nowrap",
  },
  toolbarGroupCompact: {
    flexWrap: "wrap",
  },
  btnText: {
    color: "white",
    fontSize: 14,
  },
  btnHover: {
    backgroundColor: "#5a993ffe",
  },
  tableHeader: {
    backgroundColor: "#0a6340",
    paddingVertical: 8,
    ...Platform.select({
      web: { userSelect: "none" },
    }),
  },
  headerText: {
    color: "white",
    alignSelf: "center",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "white",
  },
  pfpPlaceholder: {
    width: 37,
    height: 37,
    borderRadius: 20,
    backgroundColor: "#2c5c189d",
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  SideBarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#2c5c189d",
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  pfpInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  sideBarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
  },
  userInfo: {
    gap: 10,
    alignItems: "center",
  },
  paginationContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  pageInfo: {
    color: "#666",
    fontSize: 14,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  pageBtnText: {
    color: "#ecaa25",
    fontWeight: "600",
  },
  btnDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#eee",
  },
  disabledText: {
    color: "#bbb",
  },
  currentPageText: {
    alignSelf: "center",
    fontWeight: "bold",
    color: "#333",
  },
  arrowBtn: {
    paddingTop: 2,
  },
  activePageBtn: {
    backgroundColor: "#ffc758",
    borderColor: "#ffc758",
    color: "white",
  },
  sidePanel: {
    width: 350,
    backgroundColor: "white",
    height: "100vh",
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 600,
  },
  sidePanelCompact: {
    width: "100%",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#4f4f4f49",
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginRight: 15,
  },
  largeAvatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignSelf: "center",
  },
  editProfilePicBtn: {
    position: "absolute",
    flexDirection: "row",
    top: 120,
    left: 200,
    width: 60,
    height: 35,
  },
  editBtnWrapper: {
    backgroundColor: "#ffc95c",
    padding: 6,
    borderRadius: 60,
    borderColor: "white",
    borderWidth: 3,
  },
  panelContent: {
    padding: 20,
    position: "relative",
    flex: 1,
  },
  fullname: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 15,
  },
  details: {
    marginTop: 20,
  },
  remark: {
    marginTop: 20,
    gap: 10,
  },
  panelLabel: {
    fontWeight: "500",
    marginLeft: 15,
  },
  userDetails: {
    marginLeft: 35,
  },
  user: {
    paddingHorizontal: 10,
    marginTop: 15,
    paddingRight: 30,
  },
  actionMenu: {
    alignSelf: "flex-end",
    position: "absolute",
    zIndex: 400,
  },
  floatingMenu: {
    position: "absolute",
    right: 7,
    top: 30,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    ...Platform.select({
      web: { userSelect: "none" },
    }),
  },
  option: {
    gap: 8,
    alignSelf: "flex-start",
  },
  inputEditing: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flex: 1,
    marginTop: 5,
    minWidth: 220,
  },
  Btn: {
    width: 120,
    alignItems: "center",
    backgroundColor: "#ffc95c",
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 15,
  },
  actionBtn: {
    gap: 15,
    justifyContent: "flex-end",
  },
  iconBtn: {
    alignSelf: "center",
    padding: 8,
    borderRadius: 50,
    backgroundColor: "white",
  },
  iconBtnHover: {
    backgroundColor: "#217837",
  },
  headerRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  btn: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginLeft: "auto",
    flexShrink: 0,
    backgroundColor: "#217837",
    borderRadius: 50,
    paddingHorizontal: 23,
    paddingVertical: 10,
  },
  nameEditRow: {
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  dropdownMenu: {
    position: "absolute",
    top: 37,
    left: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    zIndex: 600,
    ...Platform.select({
      web: { userSelect: "none" },
    }),
  },
  dropdownWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  pillText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  menuItem: {
    padding: 14,
    alignItems: "center",
  },
  menuItemText: {
    ...Platform.select({
      web: { whiteSpace: "nowrap" },
    }),
  },
  menuItemActive: {
    backgroundColor: "#7d9f7a",
  },
  menuItemTextActive: {
    color: "white",
  },
  menuItemHover: {
    backgroundColor: "#f9f9f9",
  },
  pillTrigger: {
    borderWidth: 1,
    borderColor: "#0a6340",
    flexDirection: "row",
    gap: 10,
    height: 35,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
    borderRadius: 20,
    backgroundColor: "white",
    paddingHorizontal: 12,
    minWidth: 110,
    ...Platform.select({
      web: { userSelect: "none" },
    }),
  },
  inputErrorStyle: {
    borderColor: "#dc2626",
    borderWidth: 1.5,
  },
  errorLabelMicro: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    marginLeft: 35,
  },
});

export default AccountManagement;
