import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Modal,
  useWindowDimensions,
} from "react-native";
import {
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Circle,
  Trash2,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react-native";

// Import hooks and assets
import SlidingTabs from "../components/SlidingTabs";
import { formatDate } from "../utils/formatDate";
import { useEnrollmentManagement } from "../hooks/useEnrollmentManagement";
import { usePayment } from "../hooks/usePayment";
import { useSubmissionManagement } from "../hooks/useSubmissionManagement";
import EnrollmentDetailModal from "../components/EnrollmentDetailModal";
import { Status_Config } from "../utils/status_config";
import { paymentService } from "../services/PaymentService";

const EnrollmentManagement = () => {
  // Enrollment management
  const {
    enrollments,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    searchQuery,
    setSearchQuery,
    currentStatus,
    setCurrentStatus,
    sortConfig,
    requestSort,
    resetSort,
    handleUpdateStatus,
    deleteRecord,
    courses,
    currentCourseId,
    setCurrentCourseId,
    fetchEnrollments,
    handleApproveBadge,
    handleRejectBadge,
  } = useEnrollmentManagement();

  // Progress
  const {
    submissions,
    currentSubmissionPage,
    searchQuery: submissionSearchQuery,
    setSearchQuery: setSubmissionSearchQuery,
    setSubmissionCurrentPage,
    submissionTotalPages,
    submissionTotalElements,
    submissionStatus,
    setSubmissionStatus,
    sortSubmissionConfig,
    requestSubmissionSort,
    auditData,
    auditLoading,
    fetchEnrollmentAudit,
    resetSubmissionSort,
    fetchSubmissions
  } = useSubmissionManagement();

  const {
    payments,
    paymentTotalPages,
    paymentTotalElements,
    currentPaymentPage,
    setPaymentCurrentPage,
    paymentStatus,
    setPaymentStatus,
    handleVerifyPayment,
    paymentSortConfig,
    requestPaymentSort,
    resetPaymentSort,
    fetchPayments,
  } = usePayment();

  const [activeTab, setActiveTab] = useState("enrollment");
  const [isOpen, setIsOpen] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUserEnrollment, setSelectedUserEnrollment] = useState(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [translateX, setTranslateX] = useState(300);
  const [tempCourseFilter, setTempCourseFilter] = useState("All");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [adminRemark, setAdminRemark] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("All");
  const [receiptUri, setReceiptUri] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 480;

  const enrollmentStatusOptions = [
    "All",
    "in_progress",
    "in_review",
    "completed",
    "failed",
    "expired",
    "Rejected",
    "pending_payment",
    "applied",
  ];

  const ProgressStatusOptions = [
    "All",
    "in_progress",
    "completed",
    "failed",
    "dropped",
    "expired",
    "in_review",
  ];

  const paymentStatusOptions = ["All", "pending", "paid", "failed", "refunded"];

  const isEnrollment = activeTab === "enrollment";
  const isSubmission = activeTab === "progress";
  const isPayment = activeTab === "payment";

  const displayData = isEnrollment
    ? enrollments
    : isSubmission
      ? submissions
      : payments || [];
  const activeTotalPages = isEnrollment
    ? totalPages
    : isSubmission
      ? submissionTotalPages
      : paymentTotalPages;
  const activeTotalElements = isEnrollment
    ? totalElements
    : isSubmission
      ? submissionTotalElements
      : paymentTotalElements;
  const activeCurrentPage = isEnrollment
    ? currentPage
    : isSubmission
      ? currentSubmissionPage
      : currentPaymentPage;
  const setActivePage = isEnrollment
    ? setCurrentPage
    : isSubmission
      ? setSubmissionCurrentPage
      : setPaymentCurrentPage;
  const activeResetConfig = isEnrollment
    ? resetSort
    : isSubmission
      ? resetSubmissionSort
      : resetPaymentSort;

  const activeSearchQuery = isEnrollment
    ? searchQuery
    : isSubmission
      ? submissionSearchQuery
      : "";
  const setActiveSearchQuery = isEnrollment
    ? setSearchQuery
    : isSubmission
      ? setSubmissionSearchQuery
      : () => {};

  const getActiveStatus = () => {
    if (isPayment) {
      return paymentStatus;
    }

    if (isSubmission) {
      return submissionStatus;
    }

    return currentStatus;
  };

  const getActiveStatusOptions = () => {
    if (isPayment) {
      return paymentStatusOptions;
    }

    if (isSubmission) {
      return ProgressStatusOptions;
    }

    return enrollmentStatusOptions;
  };

  const itemsPerPage = 10;
  const indexOfFirstItem = (activeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + displayData.length;
  const [auditModalVisible, setAuditModalVisible] = useState(false);

  const handleOpenAudit = async (id) => {
    try {
      setAuditModalVisible(true);
      setSelectedAuditId(id);
      const data = await fetchEnrollmentAudit(id);
    } catch (err) {
      console.error(err);
      setAuditModalVisible(false);
    }
  };

  const ProgressRing = ({ earned, total }) => {
    const isCompleted = earned >= total && total > 0;
    const percentage = total > 0 ? (earned / total) * 100 : 0;

    return (
      <View
        style={[
          styles.progressRing,
          isCompleted ? { borderWidth: 0 } : styles.ringIncomplete,
        ]}
      >
        <Text style={[styles.progressText, isCompleted && { color: "#fff" }]}>
          {isCompleted ? (
            <CheckCircle2 size={25} color="#063b17" />
          ) : (
            `${earned}/${total}`
          )}
        </Text>
      </View>
    );
  };

  const tabs = [
    { id: "enrollment", label: "Enrollment" },
    { id: "progress", label: "Progress" },
    { id: "payment", label: "Payment" },
  ];

  const formatted = (status) => {
    if (!status) return "N/A";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleRowPress = (enrollment) => {
    setSelectedUserEnrollment(enrollment);
    const userHistory = enrollments.filter(
      (e) => e.user_id === enrollment.user_id,
    );
    setSelectedUserHistory(userHistory);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    setTranslateX(filterVisible ? 0 : 400);
  }, [filterVisible]);

  useEffect(() => {
    let isActive = true;

    const loadReceipt = async () => {
      if (!paymentModalVisible || !selectedPayment?.id) {
        setReceiptUri(null);
        setReceiptError("");
        setReceiptLoading(false);
        return;
      }

      setReceiptLoading(true);
      setReceiptError("");

      try {
        const receipt = await paymentService.getReceiptFile(selectedPayment.id);
        if (isActive) {
          setReceiptUri(receipt.uri);
        }
      } catch (err) {
        if (isActive) {
          setReceiptUri(null);
          setReceiptError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load receipt",
          );
        }
      } finally {
        if (isActive) {
          setReceiptLoading(false);
        }
      }
    };

    loadReceipt();

    return () => {
      isActive = false;
    };
  }, [paymentModalVisible, selectedPayment?.id]);

  const renderEnrollmentHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerText, { flex: 3 }]}>Full Name</Text>
      <Pressable
        onPress={() => requestSort("course_id")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>Course Code</Text>
        {sortConfig.key === "course_id" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerText, { flex: 4 }]}>Course Name</Text>
      <Pressable
        onPress={() => requestSort("enrolled_at")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>Enrolled On</Text>
        {sortConfig.key === "enrolled_at" && sortConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Expiry On</Text>
    </View>
  );

  const renderSubmissionsHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerText, { flex: 3 }]}>Full Name</Text>
      <Pressable
        onPress={() => requestSubmissionSort("course_id")}
        style={[styles.headerRow, { flex: 2 }]}
      >
        <Text style={styles.headerText}>Course Code</Text>
        {sortSubmissionConfig.key === "course_id" &&
        sortSubmissionConfig.direction === "asc" ? (
          <ArrowUpNarrowWide size={14} color="white" />
        ) : (
          <ArrowDownWideNarrow size={14} color="white" />
        )}
      </Pressable>
      <Text style={[styles.headerText, { flex: 4 }]}>Course Name</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Status</Text>
      <Text style={[styles.headerText, { flex: 1 }]}>Badge</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Issued On</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Expiry On</Text>
    </View>
  );

  const renderPaymentHeader = () => (
    <View style={[styles.tableHeader, styles.row]}>
      <Text style={[styles.headerText, { flex: 4 }]}>Full Name</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>Amount</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>Status</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>Paid On</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>Processed On</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Receipt</Text>
    </View>
  );

  const getProfileImageUri = (item) =>
    item?.profileImage ||
    item?.pfp_url ||
    item?.pfp ||
    item?.user_profile_image ||
    item?.profile_image ||
    null;

  const renderEnrollmentItem = ({ item }) => {
    const statusConfig = Status_Config[item.status?.toLowerCase()] || {
      color: "#8f8f8f",
      label: item.status,
    };
    return (
      <Pressable
        onPress={() => handleRowPress(item)}
        style={({ hovered }) => [
          styles.row,
          styles.tableRow,
          hovered && { backgroundColor: "#f9f9f9" },
          selectedUserEnrollment?.id === item.id && {
            backgroundColor: "#fff8e1",
          },
        ]}
      >
        <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
          {getProfileImageUri(item) ? (
            <Image
              source={{ uri: getProfileImageUri(item) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.pfpPlaceholder}>
              <Text style={styles.pfpInitials}>
                {item.fullName ? item.fullName[0].toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <Text>{item.fullName}</Text>
        </View>
        <Text style={{ flex: 2 }}>{item.course_id}</Text>
        <Text style={{ flex: 4 }}>{item.courseName}</Text>
        <Text style={{ flex: 2 }}>{formatDate(item.enrolled_at)}</Text>
        <View style={[styles.row, styles.badge, { flex: 2 }]}>
          <Circle
            size={8}
            stroke={statusConfig.color}
            fill={statusConfig.color}
          />
          <Text style={[styles.badgeText, { color: statusConfig.color }]}>
            {statusConfig.label || formatted(item.status)}
          </Text>
        </View>
        <Text style={{ flex: 2 }}>{item.expiry_date || "N/A"}</Text>
      </Pressable>
    );
  };

  const renderSubmissionsItem = ({ item }) => {
    const statusConfig = Status_Config[item.status?.toLowerCase()] || {
      color: "#8f8f8f",
      label: item.status,
    };
    return (
      <Pressable
        onPress={async () => {
          setAuditModalVisible(true);
          setSelectedAuditId(item.id);
          await fetchEnrollmentAudit(item.id);
        }}
        style={({ hovered }) => [
          styles.row,
          styles.tableRow,
          hovered && { backgroundColor: "#f9f9f9" },
          selectedUserEnrollment?.id === item.id && {
            backgroundColor: "#fff8e1",
          },
        ]}
      >
        <View style={[{ flex: 3 }, styles.userInfo, styles.row]}>
          {getProfileImageUri(item) ? (
            <Image
              source={{ uri: getProfileImageUri(item) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.pfpPlaceholder}>
              <Text style={styles.pfpInitials}>
                {item.user_fullname ? item.user_fullname[0].toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <Text>{item.user_fullname}</Text>
        </View>
        <Text style={{ flex: 2 }}>{item.course_id}</Text>
        <Text style={{ flex: 4 }}>{item.course_details?.title}</Text>
        <View style={[styles.row, styles.badge, { flex: 2 }]}>
          <Circle
            size={8}
            stroke={statusConfig.color}
            fill={statusConfig.color}
          />
          <Text style={[styles.badgeText, { color: statusConfig.color }]}>
            {statusConfig.label || item.status}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Image
            source={
              item.course_details?.badge_img_url
                ? { uri: item.course_details.badge_img_url }
                : require("../../assets/course_badge.png")
            }
            style={styles.avatar}
          />
        </View>
        <Text style={{ flex: 2 }}>
          {formatDate(item.completed_at) || "N/A"}
        </Text>
        <Text style={{ flex: 2 }}>
          {item.badge_expiry_on ? formatDate(item.badge_expiry_on) : "N/A"}
        </Text>
      </Pressable>
    );
  };

  const handleApprovePayment = async () => {
    try {
      await handleVerifyPayment(selectedPayment.id, "paid");

      setPaymentModalVisible(false);
      setSelectedPayment(null);
      await fetchPayments();
      await fetchEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async () => {
    try {
      await handleVerifyPayment(selectedPayment.id, "failed", adminRemark);

      setRejectModalVisible(false);
      setPaymentModalVisible(false);
      setAdminRemark("");
      setSelectedPayment(null);
      await fetchPayments();
      await fetchEnrollments();
    } catch (err) {
      console.error(err);
    }
  };
  // Handle approve badge
  const ApproveBadgeAction = async (id) => {
    try {
      const result = await handleApproveBadge(id);
      if (result.success) {
        setAuditModalVisible(false);
        await fetchEnrollmentAudit(id);
        await setSubmissionCurrentPage((p) => p);
        await fetchEnrollments();
        await fetchSubmissions();
      } else {
        alert("Failed to approve: " + result.error);
      }
    } catch (err) {
      console.error(err);
    }
  };
  // Handle reject badge
  const RejectBadgeAction = async (id) => {
    if (!window.confirm("Reject this badge and mark enrollment as failed?"))
      return;

    const result = await handleRejectBadge(id);
    if (result.success) {
      alert("Badge rejected.");
      setAuditModalVisible(false);
      await fetchEnrollmentAudit(id);
      await setSubmissionCurrentPage((p) => p);
      await fetchEnrollments();
      await fetchSubmissions();
    } else {
      alert("Error rejecting badge: " + result.error);
    }
  };

  const handleDownloadReceipt = () => {
    if (selectedPayment?.id) {
      paymentService
        .getReceiptFile(selectedPayment.id)
        .then((receipt) => {
          window.open(receipt.uri, "_blank");
        })
        .catch((err) => {
          console.error("Failed to open receipt", err);
        });
    }
  };

  const renderPaymentItem = ({ item }) => {
    const statusConfig = Status_Config[item.status?.toLowerCase()] || {
      color: "#8f8f8f",
      label: item.status || "Unknown",
    };

    return (
      <Pressable
        onPress={() => {
          setSelectedPayment(item);
          setPaymentModalVisible(true);
        }}
        style={({ hovered }) => [
          styles.row,
          styles.tableRow,
          hovered && { backgroundColor: "#f9f9f9" },
        ]}
      >
        <View style={[{ flex: 4 }, styles.userInfo, styles.row]}>
          {getProfileImageUri(item) ? (
            <Image
              source={{ uri: getProfileImageUri(item) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.pfpPlaceholder}>
              <Text style={styles.pfpInitials}>
                {item.user_fullname ? item.user_fullname[0].toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <Text>{item.user_fullname}</Text>
        </View>

        <Text style={{ flex: 3 }}>RM {item.amount ?? 0}</Text>
        <View style={[styles.row, styles.badge, { flex: 3 }]}>
          <Circle
            size={8}
            stroke={statusConfig.color}
            fill={statusConfig.color}
          />
          <Text style={[styles.badgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Text style={{ flex: 3 }}>
          {item.created_at ? formatDate(item.created_at) : "N/A"}
        </Text>
        <Text style={{ flex: 3 }}>
          {item.processed_at ? formatDate(item.processed_at) : "N/A"}
        </Text>
        <View style={{ flex: 2 }}>
          <Pressable
            onPress={() => {
              if (item.receipt_filepath) {
                window.open(item.receipt_filepath, "_blank");
              }
            }}
            style={styles.downloadBtn}
          >
            <Text style={styles.downloadBtnText}>Download</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= activeTotalPages; i++) {
      pageNumbers.push(i);
    }
    return (
      <View style={[styles.paginationContainer, styles.row]}>
        <Text style={styles.pageInfo}>
          Showing {displayData.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
          {indexOfLastItem} of {activeTotalElements} records
        </Text>
        <View style={styles.row}>
          <Pressable
            disabled={activeCurrentPage === 1}
            onPress={() => setActivePage(1)}
            style={[
              styles.pageBtn,
              activeCurrentPage === 1 && styles.btnDisabled,
            ]}
          >
            <Text style={styles.arrowBtn}>
              <ChevronsLeft
                size={18}
                color={activeCurrentPage === 1 ? "#bbb" : "#ecaa25"}
              />
            </Text>
          </Pressable>
          <Pressable
            disabled={activeCurrentPage === 1}
            onPress={() => setActivePage((prev) => prev - 1)}
            style={[
              styles.pageBtn,
              activeCurrentPage === 1 && styles.btnDisabled,
            ]}
          >
            <Text style={styles.arrowBtn}>
              <ChevronLeft
                size={18}
                color={activeCurrentPage === 1 ? "#bbb" : "#ecaa25"}
              />
            </Text>
          </Pressable>
          {pageNumbers.map((number) => (
            <Pressable
              key={number}
              onPress={() => setActivePage(number)}
              style={[
                styles.pageBtn,
                activeCurrentPage === number && styles.activePageBtn,
              ]}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  activeCurrentPage === number && { color: "white" },
                ]}
              >
                {number}
              </Text>
            </Pressable>
          ))}
          <Pressable
            disabled={activeCurrentPage === activeTotalPages}
            onPress={() => setActivePage((prev) => prev + 1)}
            style={[
              styles.pageBtn,
              activeCurrentPage === activeTotalPages && styles.btnDisabled,
            ]}
          >
            <Text style={styles.arrowBtn}>
              <ChevronRight
                size={18}
                color={
                  activeCurrentPage === activeTotalPages ? "#bbb" : "#ecaa25"
                }
              />
            </Text>
          </Pressable>
          <Pressable
            disabled={activeCurrentPage === activeTotalPages}
            onPress={() => setActivePage(activeTotalPages)}
            style={[
              styles.pageBtn,
              activeCurrentPage === activeTotalPages && styles.btnDisabled,
            ]}
          >
            <Text style={styles.arrowBtn}>
              <ChevronsRight
                size={18}
                color={
                  activeCurrentPage === activeTotalPages ? "#bbb" : "#ecaa25"
                }
              />
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Enrollment Management</Text>
        <SlidingTabs
          tabs={tabs}
          activeTab={activeTab}
          collapseOnCompact
          onTabChange={(id) => {
            setActiveTab(id);
            if (id === "enrollment") {
              setCurrentPage(1);
            } else if (id === "progress") {
              setSubmissionCurrentPage(1);
            } else {
              setPaymentCurrentPage(1);
            }
          }}
        />

        <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
          <View
            style={[styles.toolbarRow, isCompact && styles.toolbarGroupCompact]}
          >
            <Pressable onPress={activeResetConfig} style={styles.iconBtn}>
              <RotateCcw size={20} />
            </Pressable>
            <View style={[styles.search, styles.row]}>
              <Search size={18} color="#8f8f8f" />
              <TextInput
                style={styles.input}
                placeholder="Search..."
                value={activeSearchQuery}
                onChangeText={(text) => {
                  setActiveSearchQuery(text);
                  setActivePage(1);
                }}
              />
            </View>

            <View style={styles.dropdownWrapper}>
              <Pressable
                style={styles.pillTrigger}
                onPress={() => setIsOpen(!isOpen)}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.pillText}
                >
                  {getActiveStatus() === "All"
                    ? "Status"
                    : formatted(getActiveStatus())}
                </Text>
                {isOpen ? (
                  <ChevronUp size={16} color="#4b5563" />
                ) : (
                  <ChevronDown size={16} color="#4b5563" />
                )}
              </Pressable>
              {isOpen && (
                <View style={styles.dropdownMenu}>
                  {getActiveStatusOptions().map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.menuItem,
                        getActiveStatus() === status && styles.menuItemActive,
                      ]}
                      onPress={() => {
                        if (isPayment) {
                          setPaymentStatus(status);
                        } else if (isSubmission) {
                          setSubmissionStatus(status);
                        } else {
                          setCurrentStatus(status);
                        }
                        setActivePage(1);
                        setIsOpen(false);
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                          styles.menuItemText,
                          getActiveStatus() === status &&
                            styles.menuItemTextActive,
                        ]}
                      >
                        {formatted(status)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            {activeTab === "enrollment" && (
              <Pressable
                onPress={() => setFilterVisible(true)}
                style={() => [styles.iconBtn]}
              >
                <Filter size={20} color={filterVisible ? "#0a6340" : "#666"} />
              </Pressable>
            )}
          </View>
        </View>

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
                data={displayData}
                loading={loading}
                ListHeaderComponent={
                  isEnrollment
                    ? renderEnrollmentHeader
                    : isSubmission
                      ? renderSubmissionsHeader
                      : renderPaymentHeader
                }
                renderItem={
                  isEnrollment
                    ? renderEnrollmentItem
                    : isSubmission
                      ? renderSubmissionsItem
                      : renderPaymentItem
                }
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.tableRow}>
                    <Text>{loading ? "Loading..." : "No Record Found."}</Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>

        {activeTotalPages > 1 && renderPagination()}

        <EnrollmentDetailModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedUserEnrollment(null);
          }}
          data={selectedUserEnrollment}
          userEnrollments={selectedUserHistory}
          allCourses={courses}
          onApprove={async (id) => {
            const res = await handleUpdateStatus(id, "in_progress");
            if (res.success) setDetailModalVisible(false);
          }}
          // Rejected
          onUnenroll={async (id) => {
            const res = await handleUpdateStatus(id, "dropped");
            if (res.success) setDetailModalVisible(false);
          }}
          onDelete={async (id) => {
            if (window.confirm("Delete this record permanently?")) {
              const res = await deleteRecord(id);
              if (res.success) setDetailModalVisible(false);
            }
          }}
          status={selectedUserEnrollment?.status}
        />
        <Modal
          animationType="fade"
          transparent
          visible={auditModalVisible}
          onRequestClose={() => setAuditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.auditModalContent, isCompact && styles.auditModalContentCompact]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {auditLoading
                    ? "Syncing..."
                    : `Progress: ${auditData?.course?.title}`}
                </Text>
                <Pressable onPress={() => setAuditModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView>
                {auditLoading ? (
                  <Text style={styles.loadingText}>
                    Fetching database logs...
                  </Text>
                ) : (
                  auditData?.course?.modules?.map((module, mIdx) => (
                    <View key={mIdx} style={styles.moduleCard}>
                      <Text style={styles.moduleTitle}>
                        Module: {module.title}
                      </Text>
                      {module.pages?.map((page) => {
                        const earned =
                          page.elements?.reduce(
                            (acc, el) =>
                              acc + (el.submissions?.length > 0 ? el.score : 0),
                            0,
                          ) || 0;
                        return (
                          <View key={page.id} style={styles.pageAuditRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pageTitleText}>
                                {page.title}
                              </Text>
                              <Text style={styles.pageSubText}>
                                {page.final_quiz
                                  ? "Final Assessment"
                                  : "Content Module"}
                              </Text>
                            </View>
                            <ProgressRing
                              earned={earned}
                              total={page.passing_score}
                            />
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
              {auditData?.status === "in_review" && (
                <View style={styles.row}>
                  <Pressable
                    style={[styles.actionBtn, styles.outlineBtn]}
                    onPress={() => RejectBadgeAction(selectedAuditId)}
                  >
                    <Text style={styles.outlineBtnText}>Reject</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, styles.solidApproveBtn]}
                    onPress={() => ApproveBadgeAction(selectedAuditId)}
                  >
                    <Text style={styles.solidBtnText}>Approve</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={paymentModalVisible}
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.paymentModalContent, isCompact && styles.paymentModalContentCompact]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Details</Text>

                <Pressable onPress={() => setPaymentModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              {selectedPayment && (
                <>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.paymentUserSection}>
                      {getProfileImageUri(selectedPayment) ? (
                        <Image
                          source={{
                            uri: getProfileImageUri(selectedPayment),
                          }}
                          style={styles.paymentAvatar}
                        />
                      ) : (
                        <View style={styles.paymentAvatarPlaceholder}>
                          <Text style={styles.paymentAvatarInitial}>
                            {selectedPayment.user_fullname?.[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentUserName}>
                          {selectedPayment.user_fullname}
                        </Text>
                        <Text style={styles.paymentCourse}>
                          {selectedPayment.course_title || "Course"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.receiptSection}>
                      {receiptLoading ? (
                        <View style={styles.noReceiptBox}>
                          <Text style={styles.noReceiptText}>
                            Loading receipt...
                          </Text>
                        </View>
                      ) : receiptUri ? (
                        <Image
                          source={{
                            uri: receiptUri,
                          }}
                          style={styles.receiptImage}
                        />
                      ) : receiptError ? (
                        <View style={styles.noReceiptBox}>
                          <Text style={styles.noReceiptText}>
                            {receiptError}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.noReceiptBox}>
                          <Text style={styles.noReceiptText}>
                            No Receipt Uploaded
                          </Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                  <View style={styles.paymentActionRow}>
                    {selectedPayment?.status === "pending" && (
                      <View style={styles.row}>
                        <Pressable
                          style={[styles.actionBtn, styles.outlineBtn]}
                          onPress={() => setRejectModalVisible(true)}
                        >
                          <Text style={styles.outlineBtnText}>Received</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionBtn, styles.solidApproveBtn]}
                          onPress={handleApprovePayment}
                        >
                          <Text style={styles.solidBtnText}>Rejected</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={rejectModalVisible}
          onRequestClose={() => setRejectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.rejectModalContent, isCompact && styles.rejectModalContentCompact]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reject Payment</Text>

                <Pressable onPress={() => setRejectModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.rejectLabel}>Admin Remarks</Text>

              <TextInput
                multiline
                value={adminRemark}
                onChangeText={setAdminRemark}
                placeholder="Enter rejection remarks..."
                style={styles.rejectInput}
              />

              <View style={styles.rejectActionRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setRejectModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.rejectConfirmBtn}
                  onPress={handleRejectPayment}
                >
                  <Text style={styles.actionBtnText}>Confirm Reject</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <View style={[styles.filterSidebar, { transform: [{ translateX }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Courses Filters</Text>
          <Pressable onPress={() => setFilterVisible(false)}>
            <X size={24} color="#666" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sidebarContent}
        >
          <View style={styles.sidebarSection}>
            <Pressable
              style={[
                styles.sidebarItem,
                tempCourseFilter === "All" && styles.sidebarItemActive,
              ]}
              onPress={() => setTempCourseFilter("All")}
            >
              <Text
                style={[
                  styles.sidebarItemText,
                  tempCourseFilter === "All" && styles.sidebarItemTextActive,
                ]}
              >
                All Courses
              </Text>
            </Pressable>

            {courses.map((course) => (
              <Pressable
                key={course.id}
                style={[
                  styles.sidebarItem,
                  tempCourseFilter === course.title && styles.sidebarItemActive,
                ]}
                onPress={() => setTempCourseFilter(course.title)}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.sidebarItemText,
                    tempCourseFilter === course.title &&
                      styles.sidebarItemTextActive,
                  ]}
                >
                  {course.id} - {course.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Pressable
            style={styles.sidebarResetBtn}
            onPress={() => {
              setTempCourseFilter("All");
              setSelectedCourseFilter("All");
              setFilterVisible(false);
            }}
          >
            <Text style={styles.sidebarResetText}>Reset</Text>
          </Pressable>
          <Pressable
            style={styles.sidebarApplyBtn}
            onPress={() => {
              const selected = courses.find(
                (c) => c.title === tempCourseFilter,
              );
              setCurrentCourseId(selected ? selected.id : "All");
              setFilterVisible(false);
              setActivePage(1);
            }}
          >
            <Text style={styles.sidebarApplyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  toolbar: {
    marginVertical: 20,
    zIndex: 500,
    alignItems: "center",
  },
  toolbarCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  toolbarRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 12,
  },
  toolbarGroupCompact: {
    flexWrap: "wrap",
  },
  table: {
    flexShrink: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: 500,
    marginBottom: 5,
  },
  search: {
    borderWidth: 1,
    borderColor: "#8f8f8f",
    width: "auto",
    flexBasis: 260,
    minWidth: 140,
    maxWidth: 300,
    flexGrow: 1,
    flexShrink: 1,
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
    outlineStyle: "none",
  },
  iconBtn: {
    alignSelf: "center",
    padding: 8,
    color: "#217837",
    borderRadius: 50,
    backgroundColor: "white",
  },
  iconBtnHover: {
    backgroundColor: "#217837",
    color: "white",
  },
  menuItem: {
    padding: 14,
    alignItems: "center",
    width: "100%",
  },
  menuItemText: {
    whiteSpace: "nowrap",
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
    width: 160,
  },
  dropdownWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  pillTrigger: {
    border: "1px solid #0a6340",
    width: 160,
    flexDirection: "row",
    gap: 10,
    height: 35,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
    borderRadius: 20,
    userSelect: "none",
    backgroundColor: "white",
    paddingHorizontal: 12,
  },
  tableHeader: {
    backgroundColor: "#0a6340",
    paddingHorizontal: 12,
    paddingVertical: 8,
    userSelect: "none",
  },
  headerRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  headerText: {
    color: "white",
    alignSelf: "center",
    fontWeight: 500,
  },
  pillText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  tableRow: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#8f8f8f84",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  userInfo: {
    gap: 10,
    alignItems: "center",
  },
  badge: {
    alignItems: "center",
    gap: 5,
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
    borderRadius: "50%",
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
    border: 0,
    color: "white",
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
    borderRadius: 60,
    backgroundColor: "#2c5c189d",
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  pfpInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  auditModalContent: {
    width: "100%",
    maxWidth: 800,
    maxHeight: "95%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
  },
  auditModalContentCompact: {
    width: "92%",
    maxHeight: "90%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0a6340",
  },
  closeBtn: {
    fontSize: 20,
    color: "#999",
  },
  moduleCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  pageAuditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pageTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  pageSubText: {
    fontSize: 11,
    color: "#999",
  },

  progressRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  ringIncomplete: {
    borderColor: "#ddd",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
  },
  progressText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#999",
  },
  loadingText: {
    textAlign: "center",
    padding: 40,
    color: "#666",
  },
  paymentModalContent: {
    width: "100%",
    maxWidth: 800,
    maxHeight: "95%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
  },
  paymentModalContentCompact: {
    width: "92%",
    maxHeight: "90%",
    padding: 16,
  },
  paymentUserSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
  },
  paymentAvatar: {
    width: 65,
    height: 65,
    borderRadius: 50,
  },
  paymentAvatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: "#2c5c189d",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAvatarInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 24,
  },
  paymentUserName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  receiptSection: {
    marginTop: 10,
  },

  receiptTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  receiptImage: {
    width: "100%",
    height: 450,
    borderRadius: 16,
    resizeMode: "contain",
    backgroundColor: "#f5f5f5",
  },
  noReceiptBox: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  noReceiptText: {
    color: "#888",
    fontSize: 14,
  },

  filterSidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "white",
    zIndex: 1001,
    padding: 20,
    boxShadow: "-2px 0px 10px rgba(0,0,0,0.1)",
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  sidebarContent: {
    flex: 1,
    marginTop: 20,
  },
  sidebarSection: {
    marginBottom: 25,
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  sidebarItemActive: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  sidebarItemText: {
    fontSize: 13,
    color: "#666",
  },
  sidebarItemTextActive: {
    color: "#0a6340",
    fontWeight: "600",
  },
  sidebarFooter: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sidebarApplyBtn: {
    flex: 2,
    backgroundColor: "#0a6340",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  sidebarApplyText: {
    color: "white",
    fontWeight: "600",
  },
  sidebarResetBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  sidebarResetText: {
    color: "#64748b",
    fontWeight: "600",
  },
  paymentCourse: {
    marginTop: 4,
    color: "#666",
    fontSize: 13,
  },
  paymentInfoRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  remarkSection: {
    marginTop: 20,
  },
  remarkLabel: {
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  remarkInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  paymentActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 25,
  },
  downloadBtn: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
  },
  outlineBtnText: {
    color: "#4b5563",
    fontWeight: "700",
    fontSize: 14,
  },
  downloadBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  downloadTableBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  downloadTableBtnText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 12,
  },
  rejectModalContent: {
    width: "40%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
  },
  rejectModalContentCompact: {
    width: "92%",
    padding: 16,
  },
  rejectLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  rejectInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    outlineStyle: "none",
    backgroundColor: "#fafafa",
  },
  rejectActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: "#475569",
    fontWeight: "600",
  },
  rejectConfirmBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  solidApproveBtn: {
    backgroundColor: "#059669",
  },
  solidBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
export default EnrollmentManagement;
