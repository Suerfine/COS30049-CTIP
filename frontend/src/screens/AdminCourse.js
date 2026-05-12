import React, { useEffect, useState, useMemo } from "react";
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
  Platform,
  useWindowDimensions
} from "react-native";
import { CopyPlus, Search, SlidersHorizontal, CircleX, Plus } from "lucide-react-native";

// Import Components
import CourseCard from "../components/CourseCard.js";
import CourseFormContent from "../components/CourseFormContent.js";
import ModalLayout from "../components/ModalLayout.js";
import { useCourses } from "../hooks/useCourses.js";
import FilterSidebar from '../components/FilterSidebar';
import { useAuth } from "../context/AuthContext.js";
import TagCreationModal from "../components/TagCreationModal.js";

const AdminCourse = ({ navigation }) => {
  const { courses, loadCourses, loading, addCourse, editCourse, deleteCourse,filterVisible, setFilterVisible,tempFilters, setTempFilters,filters, setFilters,statusLabels, removeFilter,allCourseList, allTagList, addTag, filteredCourses,searchText, setSearchText, handleSearch} =useCourses();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const {currentUser}=useAuth();
  const [isTagModalVisible, setTagModalVisible] = useState(false);

  const { width } = useWindowDimensions();
  const cardStyles = useMemo(() => {
    if (Platform.OS !== 'web') {
      return { width: '100%', gap: 0 };
    }

    let columns = 4;
    if (width < 600) columns = 1;
    else if (width < 900) columns = 2;
    else if (width < 1200) columns = 3;

    const gapPercent = 2; 
    const calculatedWidth = (100 - (gapPercent * (columns - 1))) / columns;

    return {
      width: `${calculatedWidth}%`,
      gap: `${gapPercent}%`
    };
  }, [width]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

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
    <>
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
            <Text style={styles.btnText}> Add Course</Text>
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
          allCourseList={allCourseList}
          allTagList={allTagList}
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
        <View style={styles.row}>
          <Pressable 
              style={styles.addTagButton} 
              onPress={() => setTagModalVisible(true)}
          >
              <Plus size={16} color="white" />
              <Text style={{color: 'white', fontWeight: 'bold'}}>New Tag</Text>
          </Pressable>
          <Pressable
            style={({ hovered }) => [
              styles.filter,
              hovered && styles.filterHover,
            ]
          }
            onPress={() => {
                setTempFilters(filters);
                setFilterVisible(true);
            }}
          >
            <SlidersHorizontal />
          </Pressable>
          </View>
      </View>
      <View style={styles.pillContainer}>
          {/* Status Pill */}
          {filters.status !== 'all' && (
              <View style={styles.pill}>
                  <Text style={styles.pillText}>{statusLabels[filters.status]}</Text>
                  <Pressable onPress={() => removeFilter('status')}>
                      <CircleX size={16} color="white" />
                  </Pressable>
              </View>
          )}

          {/* Location Pills */}
          {Array.isArray(filters.location) && filters.location.map((locName) => (
              <View key={locName} style={[styles.pill, { backgroundColor: '#18704d' }]}>
                  <Text style={styles.pillText}>{locName}</Text>
                  <Pressable onPress={() => removeFilter('location', locName)}>
                      <CircleX size={16} color="white" />
                  </Pressable>
              </View>
          ))}

          {/* Category Pills */}
          {Array.isArray(filters.category) && filters.category.map((catName) => (
              <View key={catName} style={styles.pill}>
                  <Text style={styles.pillText}>{catName}</Text>
                  <Pressable onPress={() => removeFilter('category', catName)}>
                      <CircleX size={16} color="white" />
                  </Pressable>
              </View>
          ))}
      </View>

      {/* Course Card */}
      {loading ? (
        <ActivityIndicator size="large" color="#18704d" />
      ) : (
        <>
          <View style={[styles.cardContainer, { columnGap: cardStyles.gap }]}>
            {Array.isArray(filteredCourses) && filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const numModules = course.module_count ? course.module_count : 0;
                return (
                <View key={course.id} style={[styles.cardWrapper, { flexBasis: cardStyles.width, minWidth: cardStyles.width }]}>
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
                    style={{width: '100%'}}
                    isPublished={course.status === 'released' ? true : false}
                  />
                </View>
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
    <TagCreationModal 
        visible={isTagModalVisible}
        isLoading={loading}
        onCancel={() => setTagModalVisible(false)}
        onSave={async (data) => {
            const success = await addTag(data);
            if (success) setTagModalVisible(false);
        }}
    />
    <FilterSidebar
        visible={filterVisible}
        allTagList={allTagList}
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        onClose={() => setFilterVisible(false)}
        onApply={() => {
            setFilters(tempFilters);
            setFilterVisible(false);
        }}
        onReset={() => {
            const reset = { status: 'all', category: [], location: [] };
            setTempFilters(reset);
            setFilters(reset);
        }}
        role={currentUser.role}
    />
    </>
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
    marginVertical: 20,
    marginHorizontal: Platform.OS === 'web' ? 50 : 15,
    flexDirection: 'row',           
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexWrap:'wrap' 
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: '2%', 
    rowGap: 30,      
    marginBottom: 20,
    alignItems: 'stretch',
  },
  cardWrapper: {
    flexGrow: 0, 
    flexShrink: 1,
    display: 'flex',
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  pillContainer:{
    flexDirection:'row',
    flexWrap:'wrap',
    gap:8,
    marginVertical:15,
  },
  pill:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: '#0a6340',
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:20,
  },
  pillText:{
    fontSize:14,
    color:"white",
    marginRight:6,
    fontWeight:'500'
  },
  addTagButton: {
    flexDirection: "row",
    backgroundColor: "#0a6340",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  row:{
    flexDirection:'row',
    gap:25
  }
});

export default AdminCourse;
