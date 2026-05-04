import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ImageBackground,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { CopyPlus, Search, SlidersHorizontal } from "lucide-react-native";

// Import Components
import CourseCard from "../components/CourseCard.js";
import CourseFormContent from "../components/CourseFormContent.js";
import ModalLayout from "../components/ModalLayout.js";
import { useCourses } from "../hooks/useCourses.js";

const AdminCourse = ({ navigation }) => {
  const { courses, loadCourses, loading, addCourse, editCourse, deleteCourse } =
    useCourses();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleSearch = (text) => {
    setSearchText(text);
    const filterString = text
      ? `title like "%${text}%" or description like "%${text}%"`
      : "";

    loadCourses({ filter: filterString, page: 1 });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedCourse(null);
    setModalVisible(true);
  };

  const handleEdit = (course) => {
    setIsEditing(true);
    setSelectedCourse(course);
    setModalVisible(true);
  };

  const handleDelete = async (courseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?",
    );
    if (!confirmDelete) {
      return;
    }
    await deleteCourse(courseId);
  };

  const handleFormSubmit = async (FormData) => {
    let success = false;
    if (isEditing) {
      success = await editCourse(selectedCourse.id, FormData);
    } else {
      success = await addCourse(FormData);
    }

    if (success) {
      setModalVisible(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={require("../../assets/forest.png")}
        style={styles.backgroundImage}
      >
        <View style={styles.courseContainer}>
          <View>
            <Text style={styles.description}>
              Here you can find all courses
            </Text>
            <Text style={styles.title}>All Courses</Text>
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ hovered }) => [styles.btn, hovered && styles.btnHover]}
          >
            <CopyPlus />
            <Text style={styles.btnText}>Add Course</Text>
          </Pressable>
        </View>
      </ImageBackground>

      {/* Create Course Modal */}
      <ModalLayout
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <CourseFormContent
          onSubmit={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
          isLoading={loading}
          initialData={selectedCourse}
        />
      </ModalLayout>

      {/* Search and Filter */}
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Search size={18} />
          <TextInput
            style={styles.input}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search..."
            placeholderTextColor="#8f8f8f"
          />
        </View>
        <Pressable
          style={({ hovered }) => [
            styles.filter,
            hovered && styles.filterHover,
          ]}
        >
          <SlidersHorizontal />
        </Pressable>
      </View>

      {/* Course Card */}
      {loading ? (
        <ActivityIndicator size="large" color="#18704d" />
      ) : (
        <>
          <View style={styles.cardContainer}>
            {courses?.data && courses.data.length > 0 ? (
              courses?.data?.map((course) => {
                const numModules = course.modules ? course.modules.length : 0;
                return (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    coverImgUrl={course.cover_img_url}
                    courseTitle={course.title}
                    numModules={numModules || 16}
                    duration={course.expected_completion_weeks}
                    expiry={course.must_complete_in_weeks}
                    userType="admin"
                    onPress={() =>
                      navigation.navigate("AdminStack", {
                        screen: "Course Details",
                        params: { id: course.id },
                      })
                    }
                    onEdit={() => handleEdit(course)}
                    onDelete={() => handleDelete(course.id)}
                  />
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No courses found.</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "white",
  },
  description: {
    fontSize: 14,
    lineHeight: 24,
    color: "white",
  },
  courseContainer: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    userSelect: "none",
  },
  backgroundImage: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    resizeMode: "fill",
    marginTop: 10,
  },
  btn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#4a8947",
    borderRadius: 50,
    color: "white",
    paddingHorizontal: 23,
    paddingVertical: 13,
  },
  btnHover: {
    backgroundColor: "#2f6618fe",
  },
  btnText: {
    color: "white",
  },
  search: {
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
    borderColor: "#8f8f8f",
    minWidth: 300,
    padding: 5,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 2,
    outlineStyle: "none",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 30,
    marginTop: 20,
  },
  filter: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingRight: 10,
    borderRadius: 5,
  },
  filterHover: {
    color: "#efab21",
  },
  toolbar: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 20,
  },
});

export default AdminCourse;
