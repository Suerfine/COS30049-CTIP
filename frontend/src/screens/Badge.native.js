import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { CircleX, SlidersHorizontal, Search } from 'lucide-react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { useBadges } from '../hooks/useBadges';
import FilterSidebar from '../components/FilterSidebar';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const Badge = ({ navigation }) => {
    const {t, i18n}=useTranslation();
    const {
        courses,
        loading,
        getEnrollment,
        filterVisible,
        setFilterVisible,
        filters,
        tempFilters,
        setTempFilters,
        applyFilters,
        resetFilters,
        removeFilter,
        tagOptions
    } = useBadges();

    const statusLabels = {
        all: 'All Status',
        COMPLETED: 'Completed',
        IN_PROGRESS: 'In Progress',
        not_enrolled: 'Not Enrolled'
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0a6340" />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content"/>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.courseContainer}>
                    {/* Background Image */}
                    <ImageBackground 
                        source={require('../../assets/forest.png')}
                        style={styles.backgroundImage}
                    >
                        <Pressable onPress={()=>navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft size={24} color="white"/>
                        </Pressable>
                        <View style={styles.courseHeader}>
                            <View>
                                <Text style={styles.description}>{t('here you can find all courses')}</Text>
                                <Text style={styles.title}>{t('all courses')}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
                <View style={styles.filterContainer}>
                    <SlidingTabs tabs={tabs} activeTab={allcourseFilter} onTabChange={(id)=>setAllCourseFilter(id)}/>
                </View>
                <View style={styles.pillContainer}>
                    {filters.status !== 'all' && (
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>{statusLabels[filters.status]}</Text>
                            <Pressable onPress={() => removeFilter('status')}>
                                <CircleX size={16} color="white" />
                            </Pressable>
                        </View>
                    )}

                    {Array.isArray(filters.category) && filters.category.map((catName) => (
                        <View key={catName} style={styles.pill}>
                            <Text style={styles.pillText}>{catName}</Text>
                            <Pressable onPress={() => removeFilter('category', catName)}>
                                <CircleX size={16} color="white" />
                            </Pressable>
                        </View>
                    ))}
                </View>
                <View style={styles.cardContainer}>
                    {filteredCourses.length === 0?(
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('no courses found')}</Text>
                        </View>
                    ) : ( filteredCourses.map(course => {
                        const numModules = course.modules ? course.modules.length : 0;
                        return(
                        <CourseCard
                            key={course.id}
                            id={course.id}
                            imagePath={{ uri: course.image }}
                            courseTitle={course.title}
                            numModules={numModules || 16}
                            duration={course.expected_completion_weeks}
                            expiry={course.must_complete_in_weeks}
                            userType={userType}
                            progress={course.progress}
                            // enrollment
                            enrollmentStatus={course.enrollmentStatus}
                            prerequisiteGroups={course.prerequisiteGroups || []}
                            myEnrollments={myEnrollments}
                            onPress={() => navigation.navigate('ParkGuideStack', {
                                screen: 'UserModule', 
                                params: { id: course.id }
                            })}
                            onEnroll={() => {
                                Alert.alert(
                                    "Confirm Enrollment",
                                    `Are you sure you want to enroll in ${course.title}?`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { 
                                            text: "Enroll", 
                                            onPress: () => handleEnrollment(course.id) 
                                        }
                                    ]
                                );
                            }}
                            onDrop={() => handleDrop(course.id)}
                        />)
                })
                )}
                </View>
            </ScrollView>
            <FilterSidebar
                visible={filterVisible}
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                onClose={() => setFilterVisible(false)}
                onApply={() => {
                    setFilters(tempFilters);
                    setFilterVisible(false);
                }}
                onReset={() => {
                    const reset = { level: 'all', status: 'all' };
                    setTempFilters(reset);
                    setFilters(reset);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 60,
    },
    centered: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    headerSection: {
        marginTop: 40,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    filterActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    filterButton: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 40,
        paddingVertical: 20,
    },
    badgeCard: {
        width: 180,
        alignItems: 'center',
        marginBottom: 20,
    },
    imageWrapper: {
        width: 140,
        height: 140,
        marginBottom: 12,
        position: 'relative',
    },
    badgeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    lockedBadge: {
        tintColor: 'gray',
        opacity: 0.4,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#333',
    },
    expiryText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a6340',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pillText: {
        fontSize: 13,
        color: "white",
        marginRight: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});

export default Badge;